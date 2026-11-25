# The 30-minute timer

The background job (`.github/workflows/tick.yml`) posts workouts to Strava, sends reminders and runs the coach.
It is scheduled for every 30 minutes, but GitHub's free scheduler often starts it hours late. A free outside
timer (cron-job.org) fixes that by starting the job every 30 minutes itself. The GitHub schedule stays on as a backup,
and running twice is safe: reminders, Strava posts and briefings are never sent twice.

Takes about 5 minutes, once.

## 1. Make a GitHub token that can only start this job

1. Open https://github.com/settings/personal-access-tokens/new (fine-grained token).
2. **Token name:** `Locked In timer`. **Expiration:** the longest offered (or "No expiration").
3. **Repository access:** "Only select repositories" > `Lock-in-90`.
4. **Permissions** > Repository permissions > **Actions: Read and write**. Leave everything else as it is.
5. **Generate token** and copy it (starts with `github_pat_`). You only see it once.

This token can start and read workflow runs in this one repository, nothing else: no code, no secrets.
Paste it only into cron-job.org (step 2).

## 2. Create the timer on cron-job.org

1. Sign up (free) at https://cron-job.org and choose **Create cronjob**.
2. **Title:** `Locked In`.
   **URL:** `https://api.github.com/repos/HassanAbdelshafy21/Lock-in-90/actions/workflows/tick.yml/dispatches`
3. **Execution schedule:** every 30 minutes.
4. **Advanced** tab:
   - **Request method:** `POST`
   - **Headers** (add three):
     - `Authorization` = `Bearer github_pat_...` (your token)
     - `Accept` = `application/vnd.github+json`
     - `X-GitHub-Api-Version` = `2022-11-28`
   - **Request body:** `{"ref":"main"}`
5. Save, then press **Test run**. A good answer is **204 No Content**.
   - 401: the token is wrong or expired.
   - 403 or 404: the token doesn't have Actions: Read and write on Lock-in-90.
   - 422: the body isn't exactly `{"ref":"main"}`.

## 3. Check it works

- GitHub > Actions > tick: new runs appear every 30 minutes with the event **workflow_dispatch**.
- In the app, Me > Strava says "Background job ran … min ago", and the orange "last ran … h ago" warning is gone.

If the token expires, the warning comes back in the app: make a new token (step 1) and replace it in the cron-job.org header.
