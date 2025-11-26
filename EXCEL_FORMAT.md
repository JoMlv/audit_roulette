# Excel File Format for Study Repository

The Excel file should contain the following columns:

## Required Columns

- **study_name**: Name of the study
- **n_participants**: Current number of participants (can be empty)
- **n_expected_participants**: Expected number of participants (can be empty)

## Optional Columns

- **person_in_charge**: Name of the person responsible for the study
  - This person will be automatically excluded from being selected as an auditor for this study
  - The name must match exactly with a team member name (case-insensitive)
  - Leave empty if no one should be excluded

## Example Excel Structure

| study_name | n_participants | n_expected_participants | person_in_charge |
|------------|----------------|-------------------------|------------------|
| GLYMETY    | 10             | 20                      | John Smith       |
| REMODAL    | 7              | 32                      | Jane Doe         |
| LATITUDE   |                |                         |                  |

## Notes

- Empty cells for participants will show "expected" in the UI
- The person_in_charge field prevents conflicts of interest in audits
- Column names can also be: `personInCharge`, `responsible` (case-insensitive)
