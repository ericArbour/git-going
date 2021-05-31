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

export interface ViewCommit {
  sha: string;
  message: string;
}

export function commitToViewCommit(commit: NodeGit.Commit): ViewCommit {
  return {
    sha: commit.sha().substring(0, 7),
    message: commit.message(),
  };
}
