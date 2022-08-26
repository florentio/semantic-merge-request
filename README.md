# Semantic Merge Requests

> GitLab webhook status check that ensures your merge requests follow the Conventional Commits spec

> This is the adaptation of [Semantic Pull Requests](https://github.com/zeke/semantic-pull-requests) to Gitlab

## How it works

👮 Note! The default behavior of this webhook is not to police all commit messages,
but rather to ensure that every Merge request has **just enough semantic information** to be
able to trigger a release when appropriate. The goal is to gather this semantic
information in a way that doesn't make life harder for project contributors,
especially newcomers who may not know how to amend their git commit history.

By default, only the merge request title needs to have semantic prefix. If you wish to change this
behavior, see [configuration](#configuration) section below.

| Scenario                                                    | Status | Status Check Message                |
| ------------------------------------------------------------| -------| ----------------------------------- |
| Merge request title is [semantic][conventional commit type] | ✅     | `ready to be squashed`              |
| any commit is semantic                                      | ✅     | `ready to be merged or rebased`     |
| nothing is semantic                                         | ❌     | `add a semantic commit or merge request title` |

## Installation

First, create a personnal access token by following the documentation https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html

#### Deploy on Docker

```shell
docker run -d -e GITLAB_API_BASE_URL=<GITLAB_API_URL> \
-e WEBHOOK_SECRET=<WEBHOOK_SECRET> \
-p 80:80 --restart=always \
--name semantic-merge-request florentio/semantic-merge-request
```
- `GITLAB_API_BASE_URL` is the api base url, for gitlab free version https://gitlab.com/api/v4
- `WEBHOOK_SECRET` is the access token created earlier

The webhook will be accessible on http://<ip>, the URL will be used on the Gitlab Configuration below

### Gitlab congiguration

This should be configured as a [GitLab webhook](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html) for the [merge request event](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#merge-request-events).
This webhook listens for all the merge request events but only post comments when a new merge request is created.
It also require a pipeline (gitlab-ci pipeline) to run for your merge request in order to append the status check as a stage of your pipeline.

![webhook configuration example](https://i.imgur.com/6Ly3Uqx.png)

1. Set `URL` to the value of the running webhook URL.
1. Set the `Secret Token` s the access token created earlier
1. Tick `Merge request events`.

## Configuration

By default, no configuration is necessary.

If you wish to override some
behaviors, you can add a `semantic.yml` file to your `.github` directory with
the following optional settings:

```yml
# Disable validation
enabled: false
```

```yml
# Validation for merge requests mark as draft
validateDraftMr: false
```

```yml
# Always validate the PR title, and ignore the commits
titleOnly: true
```

```yml
# Always check the MR Id in MR title add it if not
addMergeRequestId: true
```

```yml
# Always validate all commits, and ignore the PR title
commitsOnly: true
```

```yml
# Always validate the PR title AND all the commits
titleAndCommits: true
```

```yml
# Require at least one commit to be valid
# this is only relevant when using commitsOnly: true or titleAndCommits: true,
# which validate all commits by default
anyCommit: true
```

```yml
# You can define a list of valid scopes
scopes:
  - scope1
  - scope2
  ...
```

```yml
# By default types specified in commitizen/conventional-commit-types is used.
# See: https://github.com/commitizen/conventional-commit-types/blob/v3.0.0/index.json
# You can override the valid types
types:
  - feat
  - fix
  - docs
  - style
  - refactor
  - perf
  - test
  - build
  - ci
  - chore
  - revert
```

```yml
# Allow use of Merge commits (eg on github: "Merge branch 'master' into feature/ride-unicorns")
# this is only relevant when using commitsOnly: true (or titleAndCommits: true)
allowMergeCommits: true
```

```yml
# Allow use of Revert commits (eg on github: "Revert "feat: ride unicorns"")
# this is only relevant when using commitsOnly: true (or titleAndCommits: true)
allowRevertCommits: true
```

## License

[Apache 2.0](LICENSE)

[conventional commit type]: https://github.com/commitizen/conventional-commit-types/blob/master/index.json
