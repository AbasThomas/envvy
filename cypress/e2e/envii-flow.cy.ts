describe("envii high-level flow", () => {
  it("opens key pages", () => {
    cy.visit("/login");
    cy.contains("envii account");
    cy.visit("/explore");
    cy.contains("Explore env repositories");
  });
});
