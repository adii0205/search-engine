const { Client } = require('@elastic/elasticsearch');

// Initialize Elasticsearch client
let client;
let elasticsearchAvailable = false;

try {
  client = new Client({
    node: 'http://localhost:9200',
    requestTimeout: 5000,
    // For local development without auth
  });
} catch (error) {
  console.log('⚠️  Elasticsearch client creation error');
  client = null;
}

// Index name for our search engine
const INDEX_NAME = 'search-results';

// Initialize Elasticsearch index
async function initializeIndex() {
  if (!client) {
    console.log('⚠️  Elasticsearch not available - using web scraping only');
    elasticsearchAvailable = false;
    return;
  }
  
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (!indexExists) {
      // Create index with mapping
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                default: {
                  type: 'standard'
                }
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'standard',
                boost: 2.0
              },
              description: {
                type: 'text',
                analyzer: 'standard'
              },
              url: {
                type: 'keyword'
              },
              fullUrl: {
                type: 'keyword'
              },
              imageUrl: {
                type: 'keyword'
              },
              thumbnail: {
                type: 'keyword'
              },
              duration: {
                type: 'keyword'
              },
              source: {
                type: 'keyword'
              },
              date: {
                type: 'date'
              },
              type: {
                type: 'keyword'
              },
              timestamp: {
                type: 'date'
              }
            }
          }
        }
      });

      console.log(`✅ Elasticsearch index '${INDEX_NAME}' created successfully`);
    } else {
      console.log(`✅ Elasticsearch index '${INDEX_NAME}' already exists`);
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error.message);
  }
}

// Index search results
async function indexResults(results, searchType = 'all') {
  if (!client || !elasticsearchAvailable) {
    return false; // Silently skip if Elasticsearch not available
  }
  
  try {
    const operations = results.flatMap((result) => [
      { index: { _index: INDEX_NAME, _id: `${searchType}-${result.id}-${Date.now()}` } },
      {
        ...result,
        type: searchType,
        timestamp: new Date()
      }
    ]);

    const bulkResponse = await client.bulk({ operations });

    if (bulkResponse.errors) {
      console.error('Some documents failed to index');
      return false;
    }

    console.log(`✅ Indexed ${results.length} results for type: ${searchType}`);
    return true;
  } catch (error) {
    console.error('Error indexing results:', error.message);
    return false;
  }
}

// Search using Elasticsearch
async function searchElasticsearch(query, searchType = 'all', size = 10) {
  if (!client || !elasticsearchAvailable) {
    return []; // Return empty array if Elasticsearch not available
  }
  
  try {
    const searchBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: query,
                fields: ['title^2', 'description', 'url'],
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      },
      size: size
    };

    // Filter by type if not searching all
    if (searchType !== 'all') {
      searchBody.query.bool.filter = [
        {
          term: { type: searchType }
        }
      ];
    }

    const response = await client.search({
      index: INDEX_NAME,
      body: searchBody
    });

    // Transform Elasticsearch results to our format
    const results = response.hits.hits.map((hit) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));

    console.log(`✅ Found ${results.length} results for query: "${query}"`);
    return results;
  } catch (error) {
    console.error('Error searching Elasticsearch:', error.message);
    return [];
  }
}

// Get indexed results count
async function getIndexStats() {
  if (!client) return 0;
  
  try {
    const stats = await client.indices.stats({ index: INDEX_NAME });
    return stats.indices[INDEX_NAME]?.primaries?.docs?.count || 0;
  } catch (error) {
    console.error('Error getting index stats:', error.message);
    return 0;
  }
}

// Clear all indexed results
async function clearIndex() {
  if (!client) return;
  
  try {
    await client.indices.delete({ index: INDEX_NAME });
    console.log(`✅ Cleared Elasticsearch index: ${INDEX_NAME}`);
    await initializeIndex();
  } catch (error) {
    console.error('Error clearing index:', error.message);
  }
}

// Health check
async function checkHealth() {
  if (!client) {
    return false;
  }
  
  try {
    const health = await client.cluster.health();
    console.log('✅ Elasticsearch cluster health:', health.status);
    elasticsearchAvailable = health.status === 'green' || health.status === 'yellow';
    return elasticsearchAvailable;
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    elasticsearchAvailable = false;
    return false;
  }
}

module.exports = {
  client,
  initializeIndex,
  indexResults,
  searchElasticsearch,
  getIndexStats,
  clearIndex,
  checkHealth,
  INDEX_NAME
};
