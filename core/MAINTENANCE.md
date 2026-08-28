# Pyodide / Polyscript Updates

This is the PyScript counterpart of the [Polyscript maintenance](https://github.com/pyscript/polyscript/blob/main/MAINTENANCE.md) playbook.

The full [PyScript release process](https://github.com/pyscript/docs/blob/main/docs/developers.md#release-pyscript) is documented separately. Use **this** file when the only change is a new [Polyscript](https://github.com/pyscript/polyscript) (and therefore a new [Pyodide](https://pyodide.org/en/stable/project/changelog.html)) version, **before** cutting the official PyScript release.

Typical order:

1. Update and publish Polyscript (see its `MAINTENANCE.md`).
2. Follow this playbook to bump Polyscript in `@pyscript/core`.
3. Merge that change, then cut a PyScript release so the CDN picks it up.

## Requirements

Same as in the [Polyscript document](https://github.com/pyscript/polyscript/blob/main/MAINTENANCE.md#requirements), **plus** [Bun](https://bun.sh/) (used by the WebSocket tests). After `npm ci`, Bun is available via the `bun` devDependency.

Work inside `core/`, not the repository root. After cloning:

```sh
cd pyscript/core
```

Create the minimal Python environment needed to minify Python (and related JS) artifacts:

```sh
python3 -m venv env
source env/bin/activate
pip3 install --upgrade pip
pip3 install --ignore-requires-python python-minifier
pip3 install setuptools
```

Keep this environment activated for the rest of the build.

## How to update Polyscript

1. Check out a new branch, using the Polyscript version you are bumping to:

    ```sh
    git checkout -b polyscript-X.Y.Z
    ```

2. Install dependencies from the lockfile:

    ```sh
    npm ci
    ```

3. Install the new Polyscript (this is what brings in the latest Pyodide):

    ```sh
    npm i polyscript@X.Y.Z
    ```

4. Build the package and wait for tests to pass:

    ```sh
    npm run build
    ```

    If Playwright cannot start, install Chromium first:

    ```sh
    npx playwright install chromium
    ```

Once tests are green, commit and open a pull request:

```sh
git add .
git commit -m 'Updated Polyscript to version X.Y.Z'
git push
```

In the PR description, link the [Pyodide changelog](https://pyodide.org/en/stable/project/changelog.html) for the version being picked up. For a Pyodide-only bump, nothing else in PyScript itself has changed, so that changelog is the useful reference. Linking the Polyscript release is also fine; it will typically point at the same Pyodide changelog.

## After the PR is merged

Update your local `main`:

```sh
git checkout main
git pull --rebase origin main
```

Then follow the official [PyScript release process](https://github.com/pyscript/docs/blob/main/docs/developers.md#release-pyscript) so the new build lands on the CDN (`pyscript.net/releases/...`). For a Pyodide-only bump you can skip the community announcement (Discord) if there is nothing else to call out.

That process creates the GitHub **CalVer** tag (`YYYY.M.N`) used by the CDN, docs, and homepage. Do not create extra tags yourself.

## Optional: publish `@pyscript/core` to npm

Publishing to npm is **not required**. The CDN release is what most users consume.

If you do publish:

-   Bump the npm (SemVer) version in `package.json` **without** creating a git tag. PyScript releases are [CalVer](https://calver.org/), not [SemVer](https://semver.org/). A second tag scheme in this repo (for example `v0.7.32` next to `2026.8.1`) is confusing, and the GitHub release already creates the tag that other repos and the CDN depend on.

    ```sh
    npm version patch --no-git-tag-version
    ```

-   Commit the `package.json` / `package-lock.json` version bump if you have not already, then publish (replace `42` with your 2FA OTP):

    ```sh
    npm publish --otp=42
    ```
