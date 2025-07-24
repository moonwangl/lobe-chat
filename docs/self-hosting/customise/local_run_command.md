npm install -g pnpm

pnpm install

pnpm add -D dotenv-cli

pnpm dotenv -e .env.local -- pnpm run db:migrate
