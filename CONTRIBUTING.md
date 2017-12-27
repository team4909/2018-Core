# Collaboration
Beyond storing code, GitHub offers a whole suite of tools to help teams work together to write larger codebases. We will make use of GitHub issues, milestones, and branching.

## Issues
GitHub "issues" should be created for **ALL** proposed changes to our codebase, including new features and bug fixes. Each GitHub issue should have three label types: a priority, a status, and a type. 

## Milestones
We'll create milestones in GitHub for our major goals.

## Branches
Branches **MUST** also be created for **ALL** changes to our codebase. Branches essentially allow us to safely modify a copy of the code without the risk of breaking the working code. 

Branches should be either named **"FEATURE-XYZ"** or **"DEFECT-XYZ"**, depending on whether the issue is a bug fix or a new feature request. The **XYZ** should be the issue number for tracking purposes.

Once development on a branch is completed & tested, a pull request(merge request) to the master branch should be created. **ALL** pull requests must be **code reviewed** by one of the lead developers and **tested** prior to being integrated.

# Summary of Team Workflow
- GitHub Issues are created for feature requests, bug fixes, and proposal
- Assignee creates branch
  - Code changes are made in branch
  - Pull request to master is created
  - PR is merged by lead developers
