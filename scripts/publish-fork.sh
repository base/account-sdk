set -euo pipefail

# ----- configuration --------------------------------------------------------
# Change this to your personal/org scope (without trailing slash)
FORK_SCOPE="@lukasrosario"

# Map workspace directory → publish name suffix
#   key   : relative path to the package folder
#   value : suffix to append after the scope (i.e. "$FORK_SCOPE/$value")
#
# Feel free to extend this map for more packages.
declare -A PKGS=(
  ["packages/account-sdk"]="account"
  ["packages/account-ui"]="account-ui"
)
# ---------------------------------------------------------------------------

VERSION="${1:-}"
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "Root dir: $ROOT_DIR"

git_status_clean() {
  if ! git diff --quiet --exit-code; then
    echo "⚠️  You have uncommitted changes. Commit or stash them before publishing." >&2
    exit 1
  fi
}

git_status_clean

for DIR in "${!PKGS[@]}"; do
  FULL_PATH="$ROOT_DIR/$DIR"
  pushd "$FULL_PATH" >/dev/null

  ORIG_NAME=$(node -e "console.log(require('./package.json').name)")
  FORK_NAME="$FORK_SCOPE/${PKGS[$DIR]}"

  echo "────────────────────────────────────────"
  echo "Processing $DIR ($ORIG_NAME → $FORK_NAME)"

  # Build using the workspace scripts (before renaming)
  echo "📦 Building $ORIG_NAME…"
  yarn build

  # Temporarily rewrite name (and version if provided)
  echo "✏️  Setting temporary name to $FORK_NAME"
  npm pkg set name="$FORK_NAME"
  if [[ -n "$VERSION" ]]; then
    echo "✏️  Bumping version to $VERSION"
    npm version "$VERSION" --no-git-tag-version
  fi

  echo "🚀 Publishing $FORK_NAME to npm…"
  npm publish --access public

  echo "↩️  Reverting package.json changes"
  git checkout -- package.json

  popd >/dev/null
  echo "Done with $FORK_NAME"
  echo
done

echo "✅ All done. Remember to push any version tags if you created them manually." 