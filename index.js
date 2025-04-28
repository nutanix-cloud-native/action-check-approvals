import { getInput, setFailed, setOutput } from '@actions/core';
import { context as _context, getOctokit } from '@actions/github';

async function getLastCommitHash(octokit, owner, repo, pull_number) {
    const commits = await octokit.rest.pulls.listCommits({
        owner,
        repo,
        pull_number,
    });
    // sort commits by date
    commits.data.sort((a, b) => new Date(b.commit.committer.date) - new Date(a.commit.committer.date));    
    const lastCommit = commits.data[commits.data.length - 1];
    return lastCommit.sha;
}


try {
    // `github.context` is the context of the workflow run
    const context = _context;

    // get github token
    const token = getInput('github-token', { required: true });
    if (!token) {
        throw new Error('GitHub token is required');
    }

    // `github.getOctokit` creates a GitHub client with the token
    const octokit = getOctokit(token);
    
    // `core.getInput` gets the input from the workflow file
    const input = getInput('input');
    
    // Get the current PR number from the context
    const prNumber = context.payload.pull_request ? context.payload.pull_request.number : null;
    if (!prNumber) {
        throw new Error('No pull request found in the context');
    }

    // Get the last commit time
    const lastCommitHash = await getLastCommitHash(octokit, context.repo.owner, context.repo.repo, prNumber);

    // Get PR reviews and store it in `reviews` variable
    const { data: reviews } = await octokit.rest.pulls.listReviews({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: prNumber,
    });

    // Filter approved reviews
    const approvedReviews = reviews.filter(review => review.state === 'APPROVED' && review.commit_id === lastCommitHash);
    console.log('Last commit hash:', lastCommitHash);
    console.log('Approved reviews:', approvedReviews);

    const requiredApprovals = parseInt(getInput('review_approvals_count'), 10) || 1;
    const hasRequiredApprovals = approvedReviews.length >= requiredApprovals;

    console.log(`Number of approved reviews: ${approvedReviews.length}`);
    console.log(`Required approvals: ${requiredApprovals}`);
    console.log(`Has required approvals: ${hasRequiredApprovals}`);

    // Get labels from the PR
    const labels = context.payload.pull_request.labels.map(label => label.name);
    console.log('Labels:', labels);

    // Check if the PR has the required labels
    const requiredLabels = getInput('approval_labels').split(',').map(label => label.trim()) || ["integration-test", "skip_integration"];
    const hasRequiredLabels = requiredLabels.some(label => labels.includes(label));
    console.log(`Required labels: ${requiredLabels}`);
    console.log(`Has required labels: ${hasRequiredLabels}`);

    if ( !hasRequiredApprovals ) {
        setFailed(`Pull request does not have the required number of approvals: ${requiredApprovals}`);
    }

    if ( !hasRequiredLabels ) {
        setFailed(`Pull request does not have the required labels: ${requiredLabels}`);
    }
    
    setOutput('status', hasRequiredApprovals && hasRequiredLabels);
    
} catch (error) {
    // If there's an error, set the action to failed
    setFailed(`Action failed with error: ${error.message}`);
}
