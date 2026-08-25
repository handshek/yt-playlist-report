#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Usage: $0 /absolute/path/for/counterscale-checkout" >&2
    exit 2
fi

checkout_dir="$1"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
patch_file="${script_dir}/counterscale-v3.4.1.patch"

if [[ -e "${checkout_dir}" ]]; then
    echo "Refusing to overwrite existing path: ${checkout_dir}" >&2
    exit 1
fi

git clone --branch v3.4.1 --depth 1 \
    https://github.com/benvinegar/counterscale.git "${checkout_dir}"
git -C "${checkout_dir}" apply --check "${patch_file}"
git -C "${checkout_dir}" apply "${patch_file}"

corepack pnpm@9.15.0 --dir "${checkout_dir}" install --frozen-lockfile
corepack pnpm@9.15.0 --dir "${checkout_dir}" --filter @counterscale/server test
corepack pnpm@9.15.0 --dir "${checkout_dir}" --filter @counterscale/server build
corepack pnpm@9.15.0 --dir "${checkout_dir}" --filter @counterscale/server typecheck

echo "Prepared and verified Counterscale v3.4.1 at ${checkout_dir}"
