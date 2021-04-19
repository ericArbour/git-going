import NodeGit from 'nodegit';

export async function getRepository(
  path = process.cwd(),
): Promise<NodeGit.Repository> {
  return await NodeGit.Repository.open(path);
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

async function getBranchCommits(
  repo: NodeGit.Repository,
  branch: NodeGit.Reference,
): Promise<NodeGit.Commit[]> {
  const walker = repo.createRevWalk();
  walker.push(branch.target());

  return await walker.getCommits(10);
}

export async function test() {
  const repo = await getRepository();
  const branches = await getLocalBranches(repo);
  const branch = branches[0];
  if (branch) {
    const commits = await getBranchCommits(repo, branch);
    commits.forEach((commit) => console.log(commit.message()));
  }
}
