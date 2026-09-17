#!/usr/bin/env bash

set -euo pipefail

MISE_BIN="$HOME/.local/bin/mise"
MISE_ZSH_LINE='eval "$(~/.local/bin/mise activate zsh)"'
MISE_BASH_LINE='eval "$(~/.local/bin/mise activate bash)"'

echo
echo "=========================================="
echo "   Web Development Environment Setup"
echo "=========================================="
echo

# --------------------------------------------------
# 1. Basic system tools
# --------------------------------------------------

echo "[1/5] Installing system packages..."

sudo apt update

sudo apt install -y \
    git \
    curl \
    wget \
    unzip \
    build-essential \
    ca-certificates

echo
echo "Git: $(git --version)"

# --------------------------------------------------
# 2. Install mise
# --------------------------------------------------

echo
echo "[2/5] Installing mise..."

if [[ ! -x "$MISE_BIN" ]]; then
    curl https://mise.run | sh
else
    echo "mise already installed."
fi

if [[ ! -x "$MISE_BIN" ]]; then
    echo "ERROR: mise installation failed."
    exit 1
fi

echo "mise: $("$MISE_BIN" --version)"

# --------------------------------------------------
# 3. Configure Bash
# --------------------------------------------------

echo
echo "[3/5] Configuring Bash..."

touch "$HOME/.bashrc"

if ! grep -Fqx "$MISE_BASH_LINE" "$HOME/.bashrc"; then
    printf '\n# mise\n%s\n' "$MISE_BASH_LINE" >> "$HOME/.bashrc"
    echo "Added mise to ~/.bashrc"
else
    echo "mise already configured in ~/.bashrc"
fi

# --------------------------------------------------
# 4. Configure Zsh
# --------------------------------------------------

echo
echo "[4/5] Configuring Zsh..."

touch "$HOME/.zshrc"

if ! grep -Fqx "$MISE_ZSH_LINE" "$HOME/.zshrc"; then
    printf '\n# mise\n%s\n' "$MISE_ZSH_LINE" >> "$HOME/.zshrc"
    echo "Added mise to ~/.zshrc"
else
    echo "mise already configured in ~/.zshrc"
fi

# --------------------------------------------------
# 5. Install Node.js LTS
# --------------------------------------------------

echo
echo "[5/5] Installing Node.js LTS..."

"$MISE_BIN" use --global node@lts

echo
echo "=========================================="
echo "          Installation Complete"
echo "=========================================="
echo

# Activate mise for this script's shell if possible.
eval "$("$MISE_BIN" activate bash)"

echo "Git:"
git --version

echo
echo "mise:"
"$MISE_BIN" --version

echo
echo "Node.js:"
node --version

echo
echo "npm:"
npm --version

echo
echo "=========================================="
echo " Global environment"
echo "=========================================="
echo
echo "Installed globally:"
echo "  Git"
echo "  mise"
echo "  Node.js LTS"
echo "  npm"
echo
echo "NOT installed globally:"
echo "  React"
echo "  Vue"
echo "  Angular"
echo "  Vite"
echo "  ESLint"
echo "  Prettier"
echo "  Stylelint"
echo
echo "These should be installed per project."
echo
echo "Restart your terminal, or run:"
echo
echo "  exec zsh"
echo
echo "Verify:"
echo
echo "  mise doctor"
echo "  node --version"
echo "  npm --version"
echo
echo "=========================================="
