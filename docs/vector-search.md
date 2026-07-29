# Vector Search & Retrieval

> Version: 1.0
>
> Status: Active Development
>
> Last Updated: July 2026

---

# Overview

Vector search is the core retrieval mechanism of DocMinr.ai.

Instead of searching documents using exact keywords, the platform searches for semantic similarity by comparing vector embeddings in a high-dimensional space.

This enables the system to retrieve information based on meaning rather than wording, making Retrieval-Augmented Generation (RAG) significantly more accurate for enterprise knowledge bases.

---

# Why Vector Search?

Traditional keyword search works well when users know the exact words contained within a document.

Example:

```
Query

"Reset password"

↓

Document

"Reset password"

↓

Found ✅
```

However, enterprise users rarely phrase questions exactly the same way documentation is written.

Example:

```
Query

"How do I authenticate users?"

↓

Document

"JWT based login"

↓

Keyword Search

❌

Vector Search

✅
```

Although the wording differs, both describe the same concept.

Vector search captures this semantic relationship.

---

# Retrieval Pipeline

Every query follows the same retrieval workflow.

```
User Question

↓

Query Embedding

↓

Vector Search

↓

Top-K Retrieval

↓

Metadata Filtering

↓

Context Assembly

↓

Prompt Builder

↓

Language Model
```

The retrieval stage determines which document chunks become context for the language model.

Poor retrieval directly impacts answer quality.

---

# Query Embedding

The first step converts the user's natural language query into a dense vector.

Example:

```
"How does authentication work?"

↓

Embedding Model

↓

1536-dimensional vector
```

The query vector exists in the same vector space as document embeddings.

This enables meaningful comparison between user intent and stored knowledge.

---

# Similarity Search

After generating the query embedding, the system compares it against all stored document vectors.

Rather than matching words, it measures mathematical similarity.

The chunks with the highest similarity scores become retrieval candidates.

---

# Top-K Retrieval

The vector database returns the **K most relevant chunks**.

Example:

```
User Query

↓

Vector Search

↓

Top 5 Chunks

↓

Prompt Construction
```

Selecting too few chunks may omit important context.

Selecting too many increases token usage and may introduce irrelevant information.

The optimal value depends on:

- document type
- chunk size
- context window
- LLM capabilities

---

# Similarity Threshold

Not every retrieved chunk should be accepted.

A similarity threshold filters out weak matches.

```
Similarity Score

0.95

✅

0.88

✅

0.52

❌

0.18

❌
```

This improves response quality by excluding unrelated content.

Future versions may dynamically adjust thresholds based on query type and confidence.

---

# Metadata Filtering

Semantic similarity alone is insufficient in enterprise environments.

Retrieved chunks must also satisfy business constraints.

Example filters include:

- Knowledge Base ID
- Document Type
- Department
- Access Permissions
- Language
- Tags

Example:

```
Semantic Match

+

Knowledge Base = HR

+

User Has Permission

↓

Retrieve
```

This ensures users only receive information they are authorised to access.

---

# Approximate Nearest Neighbour (ANN)

Searching every vector becomes computationally expensive as the dataset grows.

Instead, DocMinr.ai relies on Approximate Nearest Neighbour (ANN) search.

ANN algorithms trade a small amount of precision for dramatically improved search performance.

Benefits include:

- Low latency
- High scalability
- Efficient indexing
- Near real-time retrieval

For enterprise knowledge bases, this trade-off provides excellent practical performance.

---

# HNSW Indexing

Qdrant uses **Hierarchical Navigable Small World (HNSW)** graphs for efficient nearest neighbour search.

Rather than comparing every vector, HNSW builds a layered graph structure that allows the search process to navigate toward the nearest vectors efficiently.

Advantages include:

- Fast retrieval
- Excellent scalability
- High recall
- Efficient memory usage

This makes HNSW well suited for production-scale semantic search.

---

# Retrieval Ranking

Initial vector search produces candidate chunks.

These candidates may then be ranked using additional signals.

Examples include:

- Similarity score
- Document freshness
- Source reliability
- Section importance
- User permissions

Future versions may incorporate learned re-ranking models to further improve retrieval quality.

---

# Hybrid Search

Semantic search is powerful but not always sufficient.

Future versions of DocMinr.ai aim to combine:

- Dense vector search
- Keyword search (e.g. BM25)

Example:

```
Dense Search

+

Keyword Search

↓

Merged Results

↓

Re-Ranking
```

Hybrid retrieval improves performance for:

- Error codes
- Product names
- Version numbers
- Technical identifiers

where exact lexical matching is important.

---

# Query Expansion

Some user queries are ambiguous or overly concise.

Future versions may enrich queries before retrieval.

Example:

```
User Query

"Login"

↓

Expanded Query

"User authentication, JWT login, access tokens"

↓

Retrieval
```

Query expansion can improve recall without requiring users to provide additional detail.

---

# Re-Ranking

Initial retrieval identifies potentially relevant chunks.

A secondary ranking model may then reorder these candidates based on deeper semantic understanding.

Pipeline:

```
Top 20 Chunks

↓

Cross Encoder

↓

Top 5 Chunks

↓

Prompt Builder
```

Although more computationally expensive, re-ranking often improves answer quality.

---

# Retrieval Metrics

Retrieval quality should be measured objectively.

Key evaluation metrics include:

| Metric | Purpose |
|---------|----------|
| Precision@K | Relevant chunks among retrieved results |
| Recall@K | Percentage of relevant chunks retrieved |
| MRR (Mean Reciprocal Rank) | Position of first relevant result |
| nDCG | Ranking quality |
| Retrieval Latency | Search response time |

These metrics provide quantitative insight into retrieval effectiveness.

---

# Failure Scenarios

Possible retrieval failures include:

- No relevant vectors
- Corrupted embeddings
- Missing metadata
- Incorrect permissions
- Empty knowledge base

The system should respond gracefully by:

- Returning informative responses
- Logging diagnostics
- Avoiding hallucinations
- Encouraging query refinement where appropriate

---

# Engineering Decisions

### Retrieval Before Generation

The language model should never answer enterprise-specific questions without retrieved context.

---

### Metadata as a First-Class Citizen

Filtering is applied alongside similarity search to ensure relevance and enforce security.

---

### Configurable Retrieval

Top-K values, similarity thresholds, and ranking strategies should remain configurable.

Different knowledge bases may require different retrieval behaviour.

---

### Provider Independence

The retrieval layer should remain independent of any specific embedding model or language model.

Changing providers should not require architectural changes.

---

# Future Enhancements

The retrieval system is designed to evolve with the platform.

Planned capabilities include:

- Hybrid retrieval (Dense + Sparse)
- Cross-encoder re-ranking
- Multi-vector retrieval
- Knowledge graph integration
- Personalised ranking
- Temporal relevance
- Semantic caching
- Federated search across knowledge bases

These enhancements will further improve retrieval accuracy while supporting larger and more diverse enterprise knowledge collections.

---

# Summary

Vector search is the intelligence layer that connects user intent with organisational knowledge.

By combining dense embeddings, efficient ANN indexing, metadata-aware filtering, configurable retrieval strategies, and future hybrid search capabilities, DocMinr.ai delivers a scalable and accurate retrieval system suitable for enterprise AI applications.
