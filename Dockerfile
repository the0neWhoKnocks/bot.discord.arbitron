FROM node:18.12-alpine3.17 as node18-base

# start building the base
FROM node18-base as arbitron--packagejson
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
COPY --chown=node:node ./package*.json ./
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')); \
  \
  let preInstallScript; \
  if (pkg.scripts && pkg.scripts.preinstall) preInstallScript = pkg.scripts.preinstall; \
  \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  delete lock.version; \
  \
  if (preInstallScript) pkg.scripts = { preinstall: preInstallScript }; \
  \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Set up the environment
FROM node18-base AS base-movielist
ENV NODE_ENV=production
ENV APP=/home/node/app
ENV IN_CONTAINER=true
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*

WORKDIR $APP

# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=arbitron--packagejson ./package*.json ./

# Install production dependencies
USER node
RUN npm i --only=production --quiet && rm ./package*.json

# Copy local code to the image
COPY --chown=node:node ./src/. ./

# Start the bot
CMD ["node", "./index"]
