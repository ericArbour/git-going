import NodeGit from 'nodegit';

export async function getRepository(path: string): Promise<NodeGit.Repository> {
  return await NodeGit.Repository.open(path);
}

export async function getBranch(
  repo: NodeGit.Repository,
  branchName: string,
): Promise<NodeGit.Reference> {
  return await repo.getReference(branchName);
}

export async function getLocalBranches(
  repo: NodeGit.Repository,
): Promise<NodeGit.Reference[]> {
  const references = await repo.getReferences();
  return references.filter((reference) => reference.isBranch());
}

async function getRemoteBranches(
  repo: NodeGit.Repository,
): Promise<NodeGit.Reference[]> {
  const references = await repo.getReferences();
  return references.filter((reference) => reference.isRemote());
}

export async function getBranchCommits(
  repo: NodeGit.Repository,
  branch: NodeGit.Reference,
): Promise<NodeGit.Commit[]> {
  const walker = repo.createRevWalk();
  walker.push(branch.target());

  return await walker.getCommits(100);
}

export interface BranchSummary {
  name: string;
  isHead: boolean;
}

export function branchToBranchSummary(
  branch: NodeGit.Reference,
): BranchSummary {
  return {
    name: branch.name().replace('refs/heads/', ''),
    isHead: branch.isHead(),
  };
}

export interface CommitSummary {
  sha: string;
  message: string;
}

export function commitToCommitSummary(commit: NodeGit.Commit): CommitSummary {
  const message = commit.message();
  const messageFirstLine = message.split('\n')[0];
  const messageSummary =
    messageFirstLine.length > 80
      ? messageFirstLine.substring(0, 77) + '...'
      : messageFirstLine;

  return {
    sha: commit.sha().substring(0, 7),
    message: messageSummary,
  };
}
