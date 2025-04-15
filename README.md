# action-check-approvals
This repository hosts a GitHub Action designed to ensure all necessary approvals are obtained before triggering integration test workflows.

## Usage
### Simple
```yaml
...
    steps:
...
      - name: Check integration test allowance status
        id: check_approvals
        uses: nutanix-cloud-native/action-check-approvals@500da755bf5c5ed1b48d643a754529b92729d400
...
```
### With optional params
```yaml
...
    steps:
...
      - name: Check integration test allowance status
        id: check_approvals
        uses: nutanix-cloud-native/action-check-approvals@500da755bf5c5ed1b48d643a754529b92729d400
        with:
          review_approvals_count: 2 # optional, default: 1, The number of approvals required for the PR to be tested
          approval_labels: "integration-test" # optional, default: "integration-test, skip_integration", Comma-separated list of labels that allow integration tests to run
...
```
