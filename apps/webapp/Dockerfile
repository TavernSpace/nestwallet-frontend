# build environment
FROM node:18.15 as installer

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

COPY patches ./patches
COPY apps/webapp ./apps/webapp
COPY packages/app ./packages/app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY .npmrc .npmrc
RUN yarn

# runner
FROM node:18.15 AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1

COPY --from=installer /app /app
RUN yarn workspace @nestwallet/webapp build

# runner
FROM node:18.15-alpine AS runner

WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/webapp/.next ./.next
COPY --from=builder /app/apps/webapp/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"]
