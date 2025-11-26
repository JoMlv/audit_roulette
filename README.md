# Study Audit Roulette

A web-based tool for randomly assigning study audits to team members.

## Features

- Upload Excel file with study data
- Select studies and team members for audit pool
- Randomly assign audits with configurable percentage
- Track audit history with completion status
- Export logs and history to CSV

## Deployment

This site is deployed using GitHub Pages.

## Local Development

1. Clone this repository
2. Open `index.html` in a web browser, or
3. Run a local server: `python -m http.server` or use VS Code Live Server

## Files

- `index.html` - Main application page
- `script.js` - Application logic
- `style.css` - Styling
- `team.json` - Team members list

## Usage

1. Upload an Excel file with columns: `study_name`, `n_participants`, `n_expected_participants`
2. Select which studies and team members to include
3. Set audit percentage
4. Click "Spin Roulette" to randomly assign an audit
