const getSemanticConfig = require('./lib/semantic-file-reader');
const getMergeRequestCommits = require('./lib/merge-request-commits');
const getMergeRequestDetail  = require('./lib/merge-request-detail');
const updateMRTitle = require("./lib/merge-request-title");
const createStatus = require('./lib/merge-request-status');
const isSemanticMessage = require('./lib/is-semantic-message');
const handleMergeRequestEvent = require('./lib/handle-merge-request-event');

const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const DEFAULT_OPTS = {
  enabled: true,
  validateDraftMr: false,
  validateWorkInProgressMr: false,
  titleOnly: false,
  addMergeRequestId: true,
  commitsOnly: false,
  titleAndCommits: false,
  anyCommit: false,
  scopes: null,
  types: null,
  allowMergeCommits: false,
  allowRevertCommits: false,
};


const handler = handleMergeRequestEvent({secret: process.env.WEBHOOK_SECRET});

// create http server for the webhook
http
  .createServer(function (req, res) {
    handler(req, res, function (err) {
      res.statusCode = 404;
      console.error('Error:', err.message);
      res.end('not found');
    });
  })
  .listen(process.env.WEBHOOK_SERVER_PORT);


async function commitsAreSemantic(commits, scopes, types, allCommits = false, allowMergeCommits, allowRevertCommits) {
  return commits[allCommits ? 'every' : 'some'](
      (commit) => isSemanticMessage(commit, scopes, types, allowMergeCommits, allowRevertCommits)
  );
}

// process merge request event
async function handleMergeRequest(event) {
  console.log(
    'Received a merge_request event for %s with title %s ',
    event.payload.repository.name,
    event.payload.object_attributes.title
  );

  let res = event.resp;

  const title = event.payload.object_attributes.title;
  const projectId = event.payload.project.id;
  const source_branch = event.payload.object_attributes.source_branch;
  const mrId = event.payload.object_attributes.iid;
  const projectApiUrl = process.env.GITLAB_API_BASE_URL+ '/projects/' + projectId
  const userConfig = await getSemanticConfig(projectApiUrl, process.env.WEBHOOK_SECRET, source_branch, {});
  const isVanillaConfig = Object.keys(userConfig).length === 0;
  const {
    enabled,
    validateDraftMr,
    validateWorkInProgressMr,
    addMergeRequestId,
    titleOnly,
    commitsOnly,
    titleAndCommits,
    anyCommit,
    scopes,
    types,
    allowMergeCommits,
    allowRevertCommits,
  } = Object.assign({}, DEFAULT_OPTS, userConfig);

  const mr = await getMergeRequestDetail(projectApiUrl, process.env.WEBHOOK_SECRET, mrId);

  const ignoreCheck = ( mr != null && mr.draft && !validateDraftMr) || ( mr != null && mr.work_in_progress && !validateWorkInProgressMr )
  console.log("mr", mr)
  let isSemantic;
  let hasSemanticTitle = false;
  let hasSemanticCommits = false;
  let nonMergeCommits = []
  if (!enabled || ignoreCheck) {
    isSemantic = true
  }
  else{
      hasSemanticTitle = isSemanticMessage(title, scopes, types);
      const commits = await getMergeRequestCommits(projectApiUrl, process.env.WEBHOOK_SECRET, mrId);
      hasSemanticCommits = await commitsAreSemantic(commits, scopes, types, (commitsOnly || titleAndCommits) && !anyCommit, allowMergeCommits, allowRevertCommits);
      nonMergeCommits = commits.filter((commit) => commit.startsWith('Merge'));

      console.log("hasSemanticTitle", hasSemanticTitle)
      console.log("commits", commits)
      console.log("hasSemanticCommits", hasSemanticCommits)
      console.log("nonMergeCommits", nonMergeCommits)


      if (!enabled || ignoreCheck) {
        isSemantic = true
      }
      else if (titleOnly) {
        isSemantic = hasSemanticTitle;
      } else if (commitsOnly) {
        isSemantic = hasSemanticCommits;
      } else if (titleAndCommits) {
        isSemantic = hasSemanticTitle && hasSemanticCommits;
      } else if (isVanillaConfig && nonMergeCommits.length === 1) {
        // Watch out for cases where there's only commit and it's not semantic.
        // GitLab won't squash PRs that have only one commit.
        isSemantic = hasSemanticCommits;
      } else {
        isSemantic = hasSemanticTitle || hasSemanticCommits;
      }
  }


  function getDescription() {
    if (!enabled) return 'skipped; check disabled in semantic.yml config'
    if (ignoreCheck) return 'skipped; merge request is a draft'
    if (!isSemantic && isVanillaConfig && nonMergeCommits.length === 1) return 'MR has only one non-merge commit and it\'s not semantic; add another commit before squashing';
    if (isSemantic && titleAndCommits) return 'ready to be merged, squashed or rebased';
    if (!isSemantic && titleAndCommits) return 'add a semantic MR title';
    if (hasSemanticTitle && !commitsOnly) return 'ready to be squashed';
    if (hasSemanticCommits && !titleOnly) return 'ready to be merged or rebased';
    if (titleOnly) return 'add a semantic MR title';
    if (commitsOnly && anyCommit) return 'add a semantic commit';
    if (commitsOnly) return 'make sure every commit is semantic';
    return 'add a semantic commit or MR title';
  }

   const state = isSemantic ? 'success' : 'failed';
    const description = getDescription();
    const result = await createStatus(projectApiUrl, process.env.WEBHOOK_SECRET, mrId,
      {
        state: state,
        target_url: 'https://github.com/florentio/semantic-merge-requests',
        description: description,
        context: 'Semantic Merge Request',
      }
    );

    if (addMergeRequestId && !title.trim().endsWith("(!" + mr_id + ")"))
      await updateMRTitle(
        process.env.GITLAB_API_URL,
        process.env.WEBHOOK_SECRET,
        project_id,
        mr_id,
        { title: title + " (!" + mr_id + ")" }
      );
    console.log('Semantic Merge Request  %s with message : %s ', state, description);


  res.writeHead(200, { 'content-type': 'application/json' });
  res.end("{'ok':true}");
}

// receiver of merge request event
handler.on('merge_request', handleMergeRequest);
