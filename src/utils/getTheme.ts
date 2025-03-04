export function getTheme() {
    if (document.body.hasClass("theme-dark")) { return "dark" }
    if (document.body.hasClass("theme-light")) { return "light" }
    return null;
}