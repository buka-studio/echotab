# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine AS base

LABEL fly_launch_runtime="Next.js"

# Next.js app lives here
WORKDIR /app
RUN npm install -g turbo@^2
RUN npm install -g pnpm@^10.26.0
COPY . .
RUN turbo prune @echotab/web --docker

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
# RUN apt-get update -qq && \
#     apt-get install -y python-is-python3 pkg-config build-essential 

RUN apk add --no-cache libc6-compat
RUN apk add g++ make py3-pip

# Install node modules
COPY --link package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

# Copy application code

COPY --link . .

# Build args for Next.js public env vars
ARG NEXT_PUBLIC_EXTENSION_ID
ARG NEXT_PUBLIC_HOST
ARG NEXT_PUBLIC_WEB_HOST
ENV NEXT_PUBLIC_EXTENSION_ID=$NEXT_PUBLIC_EXTENSION_ID
ENV NEXT_PUBLIC_HOST=$NEXT_PUBLIC_HOST
ENV NEXT_PUBLIC_WEB_HOST=$NEXT_PUBLIC_WEB_HOST

# Build application
RUN turbo run build --filter=@echotab/web

# Remove development dependencies
RUN pnpm prune --prod

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start:web" ]
