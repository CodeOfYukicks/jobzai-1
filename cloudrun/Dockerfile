# JobzAI - Automated Job Fetching Container
FROM node:20-slim

WORKDIR /app

# Copy package files
COPY functions/package*.json ./functions/
COPY package*.json ./

# Install dependencies
RUN cd functions && npm install --production

# Copy all necessary files
COPY functions/src ./functions/src
COPY functions/tsconfig.json ./functions/
COPY scripts ./scripts
COPY functions/lib ./functions/lib

# Build TypeScript
RUN cd functions && npm run build

# Create entrypoint script
RUN echo '#!/bin/sh\n\
echo "🚀 Starting JobzAI Automated Pipeline"\n\
echo ""\n\
echo "Step 1/2: Fetching and writing jobs..."\n\
node /app/scripts/processTasksManually.cjs\n\
echo ""\n\
echo "Step 2/2: Enriching with v2.2 tags..."\n\
node /app/scripts/reEnrichAllJobs.cjs\n\
echo ""\n\
echo "✅ Pipeline complete!"\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Copy server
COPY cloudrun/server.js /app/

# Install express
RUN npm install express

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "/app/server.js"]

