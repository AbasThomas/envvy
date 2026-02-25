#!/usr/bin/env node

import { existsSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import chalk from "chalk";
import { Command } from "commander";
import dotenv from "dotenv";
import inquirer from "inquirer";

import { createApiClient } from "./api.js";
import {
  getConfigPath,
  readGlobalConfig,
  readProjectConfig,
  writeGlobalConfig,
  writeProjectConfig,
} from "./config.js";
import { parseDotEnv, readLocalEnv, stringifyDotEnv } from "./env.js";
import {
  backupCommand,
  forkCommand,
  listCommand,
  pullCommand,
  restoreCommand,
  starCommand,
} from "./worker.js";
import { startEnvWatcher } from "./watcher.js";

dotenv.config();

const CLI_PIN_REGEX = /^\d{6}$/;

const program = new Command();
program
  .name("envii")
  .description("GitHub-style environment variable management CLI")
  .version("0.1.0");

program
  .command("login")
  .description("Authenticate and store your API token in ~/.envii/config.json")
  .option("--pin", "Authenticate with your 6-digit CLI PIN")
  .action(async (options: { pin?: boolean }) => {
    const existingConfig = readGlobalConfig();
    const loginQuestions = [
      {
        type: "input",
        name: "baseUrl",
        message: "API base URL",
        default: existingConfig.baseUrl ?? process.env.ENVII_API_URL ?? "http://localhost:3000",
      },
      {
        type: "input",
        name: "email",
        message: "Email",
        default: existingConfig.email ?? "",
      },
      ...(options.pin
        ? [
            {
              type: "password" as const,
              name: "pin",
              message: "Enter your 6-digit PIN",
              mask: "*",
              validate: (value: string) =>
                CLI_PIN_REGEX.test(value) ? true : "PIN must be exactly 6 digits.",
            },
          ]
        : [
            {
              type: "password" as const,
              name: "password",
              message: "Password",
            },
          ]),
    ] as Parameters<typeof inquirer.prompt>[0];

    const answers = await inquirer.prompt<{
      baseUrl: string;
      email: string;
      password: string;
      pin: string;
    }>(loginQuestions);

    const api = createApiClient();
    api.defaults.baseURL = answers.baseUrl;

    let data: { token: string; user: { id: string; email: string; name?: string; planTier: string; hasCliPin: boolean; onboardingCompleted: boolean } };
    try {
      const res = await api.post(
        "/api/cli/login",
        options.pin
          ? { email: answers.email, pin: answers.pin }
          : { email: answers.email, password: answers.password },
      );
      data = res.data;
    } catch (err: unknown) {
      if (err instanceof Error && !(err as { response?: unknown }).response) {
        throw err;
      }

      const e = err as { response?: { status?: number; data?: { error?: string } }; code?: string };
      if (e.code === "ECONNREFUSED" || e.code === "ECONNABORTED") {
        throw new Error(`Cannot reach server at ${answers.baseUrl}. Is it running?`);
      }
      const status = e.response?.status;
      const msg = e.response?.data?.error;
      if (status === 503) throw new Error(`Server unavailable: ${msg ?? "database unreachable"}`);
      if (status === 401) throw new Error(msg ?? "Invalid email or password");
      if (status === 429) throw new Error(msg ?? "Too many attempts. Try again later.");
      throw new Error(msg ?? `Login failed (HTTP ${status ?? "unknown"})`);
    }

    writeGlobalConfig({
      baseUrl: answers.baseUrl,
      token: data.token,
      email: data.user.email,
      userId: data.user.id,
    });

    console.log(chalk.green(`Authenticated as ${data.user.name ?? data.user.email}`));
    console.log(chalk.gray(`Config stored at ${getConfigPath()}`));

    if (!options.pin && !data.user.hasCliPin) {
      console.log(
        chalk.yellow(
          "No CLI PIN set yet. Configure one now to use `envii login --pin` on your next login.",
        ),
      );
      const pinSetup = await inquirer.prompt<{
        setupPin: boolean;
        pin: string;
        confirmPin: string;
      }>([
        {
          type: "confirm",
          name: "setupPin",
          message: "Set 6-digit CLI PIN now?",
          default: true,
        },
        {
          type: "password",
          name: "pin",
          message: "New 6-digit PIN",
          mask: "*",
          when: (ctx) => ctx.setupPin,
        },
        {
          type: "password",
          name: "confirmPin",
          message: "Confirm PIN",
          mask: "*",
          when: (ctx) => ctx.setupPin,
        },
      ]);

      if (pinSetup.setupPin) {
        if (!CLI_PIN_REGEX.test(pinSetup.pin) || pinSetup.pin !== pinSetup.confirmPin) {
          throw new Error("PIN must be exactly 6 digits and match confirmation.");
        }

        api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        await api.post("/api/auth/cli-pin", {
          pin: pinSetup.pin,
        });
        console.log(chalk.green("CLI PIN configured successfully."));
      }
    } else if (options.pin) {
      console.log(chalk.gray("PIN login complete."));
    } else {
      console.log(chalk.gray("Tip: Next time, use `envii login --pin`."));
    }
  });

program
  .command("init [name]")
  .description("Create or link a repository, then initialize current directory for envii")
  .option("-r, --repo <slug>", "Repo slug (defaults to folder name)")
  .option("-e, --environment <env>", "Target environment", "development")
  .action(async (name, options) => {
    const globalConfig = readGlobalConfig();
    if (!globalConfig.token) {
      throw new Error("Not logged in. Run `envii login` first.");
    }

    const inferredName = (name ?? options.repo ?? basename(process.cwd())).trim();
    const fallbackSlug = inferredName.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const environment =
      options.environment === "staging" || options.environment === "production"
        ? options.environment
        : "development";

    const initAnswers = await inquirer.prompt<{
      visibility: "private" | "public";
      description: string;
      repoPin: string;
      envFile: string;
    }>([
      {
        type: "list",
        name: "visibility",
        message: "Project visibility",
        choices: [
          { name: "Private", value: "private" },
          { name: "Public", value: "public" },
        ],
        default: "private",
      },
      {
        type: "input",
        name: "description",
        message: "Description (optional)",
      },
      {
        type: "password",
        name: "repoPin",
        message: "Repository 6-digit PIN",
        mask: "*",
        validate: (value: string) => (CLI_PIN_REGEX.test(value) ? true : "PIN must be exactly 6 digits."),
      },
      {
        type: "input",
        name: "envFile",
        message: "Env file path",
        default: ".env",
      },
    ]);

    const api = createApiClient();
    api.defaults.baseURL = globalConfig.baseUrl;

    let repoSlug = fallbackSlug;
    let repoId: string | undefined;
    try {
      const { data } = await api.post("/api/repos", {
        name: inferredName,
        slug: options.repo ?? fallbackSlug,
        visibility: initAnswers.visibility,
        description: initAnswers.description?.trim() || undefined,
        repoPin: initAnswers.repoPin,
        tags: [],
      });
      repoSlug = data.repo.slug;
      repoId = data.repo.id;
      console.log(chalk.green(`Created repo "${repoSlug}" (ID: ${repoId})`));
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status !== 409) throw error;
      console.log(chalk.yellow(`Repo "${repoSlug}" already exists. Linking local project.`));
    }

    writeProjectConfig({
      repoSlug,
      environment,
      envFile: initAnswers.envFile || ".env",
      commitMessage: "Initial env setup",
    });

    const envValues = readLocalEnv(initAnswers.envFile || ".env");
    if (!existsSync(".env.example")) {
      const sanitized = Object.keys(envValues).reduce<Record<string, string>>((acc, key) => {
        acc[key] = "";
        return acc;
      }, {});
      writeFileSync(".env.example", stringifyDotEnv(sanitized), "utf8");
      console.log(chalk.green("Created .env.example"));
    }

    console.log(chalk.green(`Initialized envii for repo "${repoSlug}" (${environment})`));
    console.log(chalk.gray("Local config saved (.envii.json)"));
  });

program
  .command("add [file]")
  .description("Stage the env file used by backup/push commands")
  .action((file = ".env") => {
    const current = readProjectConfig();
    if (!current) throw new Error("Run `envii init` first.");

    writeProjectConfig({
      ...current,
      envFile: file,
    });
    console.log(chalk.green(`Staged ${file} for envii backup.`));
  });

program
  .command("backup")
  .description("Backup your local env file to envii")
  .option("-m, --message <message>", "Commit message")
  .option("-k, --key <key>", "Client-side encryption key")
  .action(async (options) => {
    await backupCommand({
      commitMessage: options.message,
      key: options.key,
    });
  });

program
  .command("restore [repoSlug]")
  .description("Restore latest env snapshot into local .env")
  .option("-k, --key <key>", "Client-side decryption key")
  .action(async (repoSlug, options) => {
    await restoreCommand(repoSlug, options.key);
  });

program.command("list").description("List your envii repositories").action(listCommand);

program
  .command("commit")
  .description("Save a default commit message for the next push/backup")
  .requiredOption("-m, --message <message>", "Commit message")
  .action((options) => {
    const current = readProjectConfig();
    if (!current) throw new Error("Run `envii init` first.");

    writeProjectConfig({
      ...current,
      commitMessage: options.message,
    });
    console.log(chalk.green("Commit message staged for next push."));
  });

program
  .command("push")
  .description("Sync local .env to envii using the staged commit message")
  .option("-k, --key <key>", "Client-side encryption key")
  .action(async (options) => {
    await backupCommand({
      key: options.key,
    });
  });

program
  .command("pull")
  .description("Download latest snapshot for current repo")
  .option("-k, --key <key>", "Client-side decryption key")
  .action(async (options) => {
    await pullCommand({ key: options.key });
  });

program
  .command("fork <repoId>")
  .description("Fork a public repository")
  .action(async (repoId) => {
    await forkCommand(repoId);
  });

program
  .command("star <repoId>")
  .description("Toggle star for a repository")
  .action(async (repoId) => {
    await starCommand(repoId);
  });

program
  .command("watch")
  .description("Watch .env and prompt for backup on changes")
  .option("-f, --file <file>", "Path to env file")
  .action(async (options) => {
    const project = readProjectConfig();
    const file = options.file ?? project?.envFile ?? ".env";
    startEnvWatcher(file);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown CLI error";
  console.error(chalk.red(`Error: ${message}`));
  process.exit(1);
});

const fallbackEnv = readLocalEnv();
if (!Object.keys(fallbackEnv).length && process.env.ENVII_LOAD_PROCESS_ENV === "true") {
  parseDotEnv(Object.entries(process.env).map(([k, v]) => `${k}=${v ?? ""}`).join("\n"));
}
