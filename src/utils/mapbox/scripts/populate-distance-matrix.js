#!/usr/bin/env node

/**
 * Generate Distance Matrix Script
 *
 * This script uses the Mapbox Matrix API to generate walking durations between all GT campus locations.
 * Due to API limitations (max 25 coordinates per request), it chunks the locations into 6 groups
 * and makes 36 API requests total (6x6 chunk pairs).
 *
 * Note: Some locations share the same coordinates, resulting in 53 unique locations
 * and a 53×53 = 2,809 distance matrix.
 *
 * This script leverages the existing mapbox utilities pattern from src/utils/mapbox/
 * and uses the same environment variable (REACT_APP_MAPBOX_TOKEN) and API calling conventions.
 *
 * Usage:
 * 1. Set your Mapbox access token: export REACT_APP_MAPBOX_TOKEN="your_token_here"
 * 2. Run the script: node src/utils/mapbox/scripts/populate-distance-matrix.js
 *
 * Output: src/utils/mapbox/scripts/generated-distance-matrix.txt (TypeScript-compatible object format)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const CHUNK_SIZE = 12; // Split 62 locations into chunks of 12 (last chunk will have 2)
const REQUEST_DELAY_MS = 1000; // 1 second delay between requests
const API_BASE_URL =
  'https://api.mapbox.com/directions-matrix/v1/mapbox/walking';

/**
 * Load GT_LOCATIONS from the TypeScript file
 * Parses the locations array from src/mapConstants.ts
 */
function loadLocations() {
  const mapConstantsPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'mapConstants.ts'
  );
  const content = fs.readFileSync(mapConstantsPath, 'utf8');

  const locations = [];

  // Simple regex to find all coordinate pairs: lat: number, long: number
  const coordMatches = content.matchAll(
    /lat:\s*([\d.-]+),\s*long:\s*([\d.-]+)/g
  );

  for (const match of coordMatches) {
    locations.push({
      coords: {
        lat: parseFloat(match[1]),
        long: parseFloat(match[2]),
      },
    });
  }

  console.log(`Loaded ${locations.length} GT locations`);

  // Check for duplicate coordinates
  const coordStrings = locations.map(
    (loc) => `${loc.coords.lat},${loc.coords.long}`
  );
  const uniqueCoords = new Set(coordStrings);
  if (coordStrings.length !== uniqueCoords.size) {
    console.warn(
      `Found ${coordStrings.length - uniqueCoords.size} duplicate coordinates`
    );
    console.log(
      'Duplicate coordinates:',
      coordStrings.filter(
        (coord, index) => coordStrings.indexOf(coord) !== index
      )
    );
  }

  return locations;
}

/**
 * Split an array into chunks of specified size
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create location key in the format used by createLocationKey function
 * Format: "lat1,long1|lat2,long2"
 */
function createLocationKey(loc1, loc2) {
  return `${loc1.lat},${loc1.long}|${loc2.lat},${loc2.long}`;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch matrix data for a chunk pair from Mapbox API
 * Uses the same pattern as the existing mapbox utilities
 */
function fetchMatrixChunk(sources, destinations) {
  return new Promise((resolve, reject) => {
    const MAPBOX_ACCESS_TOKEN = process.env['REACT_APP_MAPBOX_TOKEN'];

    if (!MAPBOX_ACCESS_TOKEN) {
      reject(
        new Error('Mapbox access token not found in environment variables')
      );
      return;
    }

    // Build coordinates string: "long1,lat1;long2,lat2;..."
    const allCoords = [...sources, ...destinations]
      .map((loc) => `${loc.coords.long},${loc.coords.lat}`)
      .join(';');

    // Build sources and destinations parameters (0-based indices)
    const sourceIndices = sources.map((_, i) => i).join(';');
    const destIndices = destinations
      .map((_, i) => sources.length + i)
      .join(';');

    const url = `${API_BASE_URL}/${allCoords}?sources=${sourceIndices}&destinations=${destIndices}&annotations=duration&access_token=${MAPBOX_ACCESS_TOKEN}`;

    console.log(
      `Making request for ${sources.length} sources × ${destinations.length} destinations`
    );
    console.log(`URL: ${url.replace(MAPBOX_ACCESS_TOKEN, 'TOKEN_HIDDEN')}`);

    const request = https.get(url, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);

          if (response.statusCode !== 200) {
            const error = new Error(
              `Mapbox Matrix API error: ${response.statusCode} ${
                response.statusText
              } - ${jsonData.message || 'Unknown error'}`
            );
            error.status = response.statusCode;
            reject(error);
            return;
          }

          if (jsonData.code !== 'Ok') {
            const error = new Error(
              `Mapbox Matrix API returned error code: ${jsonData.code} - ${
                jsonData.message || 'Unknown error'
              }`
            );
            error.status = response.statusCode;
            reject(error);
            return;
          }

          resolve({
            durations: jsonData.durations,
            sources: jsonData.sources,
            destinations: jsonData.destinations,
          });
        } catch (parseError) {
          reject(
            new Error(`Failed to parse API response: ${parseError.message}`)
          );
        }
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Main function to orchestrate the distance matrix generation
 */
async function main() {
  try {
    // Validate environment
    if (!process.env.REACT_APP_MAPBOX_TOKEN) {
      throw new Error(
        'REACT_APP_MAPBOX_TOKEN environment variable is required'
      );
    }

    console.log('Starting distance matrix generation...');

    // Load locations
    const locations = loadLocations();
    if (locations.length !== 62) {
      console.warn(
        `Warning: Expected 62 locations, but found ${locations.length}`
      );
    }

    // Split into chunks
    const chunks = chunkArray(locations, CHUNK_SIZE);
    console.log(
      `Split locations into ${chunks.length} chunks: ${chunks
        .map((c) => c.length)
        .join(', ')}`
    );

    // Initialize distance matrix
    const distanceMatrix = {};
    let totalRequests = 0;
    const totalExpectedRequests = chunks.length * chunks.length;

    // Process all chunk pairs
    for (let i = 0; i < chunks.length; i++) {
      for (let j = 0; j < chunks.length; j++) {
        totalRequests++;
        console.log(
          `Processing chunk pair (${i},${j}) of ${totalExpectedRequests}...`
        );

        try {
          const result = await fetchMatrixChunk(chunks[i], chunks[j]);

          // Fill the distance matrix with results
          for (let srcIdx = 0; srcIdx < chunks[i].length; srcIdx++) {
            for (let destIdx = 0; destIdx < chunks[j].length; destIdx++) {
              const sourceLoc = chunks[i][srcIdx];
              const destLoc = chunks[j][destIdx];
              const key = createLocationKey(sourceLoc.coords, destLoc.coords);
              const duration = result.durations[srcIdx][destIdx];

              // Store duration
              distanceMatrix[key] = duration;
            }
          }

          console.log(`✓ Chunk pair (${i},${j}) completed`);
        } catch (error) {
          console.error(
            `✗ Failed to process chunk pair (${i},${j}): ${error.message}`
          );
          throw error;
        }

        // Add delay between requests (except for the last one)
        if (totalRequests < totalExpectedRequests) {
          await sleep(REQUEST_DELAY_MS);
        }
      }
    }

    // Write output file
    const outputPath = path.join(__dirname, 'generated-distance-matrix.txt');
    const totalEntries = Object.keys(distanceMatrix).length;
    const outputContent = JSON.stringify(distanceMatrix, null, 2);

    fs.writeFileSync(outputPath, outputContent, 'utf8');

    console.log(`\n✓ Distance matrix generation completed!`);
    console.log(
      `✓ Generated ${totalEntries} location pairs (53 unique locations)`
    );
    console.log(`✓ Output written to: ${outputPath}`);
    console.log(`✓ Total API requests made: ${totalRequests}`);
  } catch (error) {
    console.error(`\n✗ Script failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  loadLocations,
  chunkArray,
  createLocationKey,
  fetchMatrixChunk,
  sleep,
  main,
};
