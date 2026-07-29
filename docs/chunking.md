# Chunking Strategy

> Version: 1.0
>
> Status: Active Development
>
> Last Updated: July 2026

---

# Overview

Chunking is the process of dividing a document into smaller, semantically meaningful units before generating vector embeddings.

Although often treated as a preprocessing step, chunking has one of the greatest influences on the overall quality of a Retrieval-Augmented Generation (RAG) system.

Poor chunking can significantly reduce retrieval accuracy, increase hallucinations, and waste valuable context window space.

Well-designed chunking enables precise retrieval, better grounding, and more reliable AI responses.

For this reason, DocMinr.ai treats chunking as an independent engineering component rather than a simple text-splitting operation.

---

# Why Chunking Exists

Modern embedding models and Large Language Models cannot efficiently process extremely large documents as a single unit.

For example:

```text
Enterprise Handbook

↓

250 pages

↓

400,000 characters

↓

One Embedding ❌
```

Even if technically possible, retrieving an entire handbook for every user query would be inefficient, expensive, and irrelevant.

Instead, documents are divided into smaller knowledge units.

```text
Document

↓

Sections

↓

Paragraphs

↓

Chunks

↓

Embeddings
```

Each chunk becomes independently searchable.

---

# Objectives

The chunking strategy is designed to:

- Preserve semantic meaning
- Improve retrieval precision
- Reduce token consumption
- Support citation generation
- Maintain contextual continuity
- Handle documents of varying structure
- Enable scalable vector indexing

---

# Engineering Principles

The chunking engine follows several principles.

## Semantic Integrity

A chunk should represent one coherent idea whenever possible.

Breaking sentences or splitting related paragraphs reduces retrieval quality.

---

## Context Preservation

Important context should not disappear at chunk boundaries.

Overlap between neighbouring chunks helps preserve continuity.

---

## Predictable Size

Chunks should remain within a target size to produce stable embeddings and fit comfortably within downstream model context windows.

---

## Metadata Awareness

Every chunk carries metadata describing its origin.

Typical metadata includes:

- Document ID
- Knowledge Base ID
- Page Number
- Section Heading
- Chunk Index
- Source Filename

Metadata enables filtering, traceability, and future citation support.

---

# Chunking Workflow

```text
Raw Document

↓

Text Extraction

↓

Cleaning

↓

Structure Detection

↓

Chunk Generation

↓

Metadata Assignment

↓

Embedding Generation

↓

Vector Storage
```

Chunking is performed after text cleaning but before embedding generation.

---

# Chunking Strategies

Different strategies offer different trade-offs.

## Fixed-Size Chunking

The document is divided into equally sized blocks.

Example:

```text
Every 500 characters

↓

Chunk 1

Chunk 2

Chunk 3
```

### Advantages

- Very simple
- Fast
- Predictable

### Limitations

- Breaks paragraphs
- Ignores document structure
- Weak semantic boundaries

Suitable mainly for prototypes and experimentation.

---

## Recursive Chunking (Current Default)

Recursive chunking attempts to preserve document structure by splitting text using progressively smaller separators.

Typical hierarchy:

```text
Document

↓

Headings

↓

Paragraphs

↓

Sentences

↓

Words
```

The splitter attempts to keep larger logical sections intact before falling back to smaller units.

### Advantages

- Better semantic coherence
- Preserves paragraphs
- Works well across document types
- Produces higher retrieval quality

### Limitations

- Slightly slower
- May still split complex tables or code blocks

This is the recommended default strategy for most enterprise documents.

---

## Semantic Chunking (Future Enhancement)

Instead of relying on character counts or separators, semantic chunking identifies natural topic boundaries.

Example:

```text
Topic A

↓

Chunk A

Topic B

↓

Chunk B

Topic C

↓

Chunk C
```

This approach may use embeddings, heading detection, or language model assistance to determine where ideas naturally begin and end.

### Advantages

- Highest retrieval quality
- Preserves conceptual boundaries
- Reduces context fragmentation

### Limitations

- Computationally expensive
- More complex implementation
- Slower indexing

Semantic chunking is planned as an optional advanced strategy.

---

# Chunk Size

Chunk size influences retrieval quality, embedding cost, and response relevance.

| Chunk Size | Characteristics |
|------------|-----------------|
| Small (150–300 tokens) | High precision, lower context |
| Medium (300–700 tokens) | Balanced performance |
| Large (700–1200 tokens) | More context, lower precision |

The optimal size depends on the document type and retrieval objectives.

DocMinr.ai aims to support configurable chunk sizes to accommodate different workloads.

---

# Chunk Overlap

Neighbouring chunks may share a small portion of text.

Example:

```text
Chunk 1

Introduction...

Authentication...

Authorization...

------------------

Chunk 2

Authorization...

JWT Tokens...

Middleware...
```

The repeated "Authorization" section helps preserve continuity across chunk boundaries.

Typical overlap ranges between **10–20%** of the chunk size.

Benefits include:

- Improved context retention
- Better retrieval around section boundaries
- Reduced information loss

Excessive overlap should be avoided as it increases storage requirements and duplicate retrieval.

---

# Special Content Handling

Not all document elements should be processed identically.

## Tables

Tables should remain intact whenever possible.

Splitting rows across chunks may destroy relationships between columns and values.

---

## Lists

Ordered and unordered lists should remain grouped.

Breaking lists into separate chunks may lose procedural context.

---

## Code Blocks

Code snippets should be preserved as complete logical units.

Splitting functions or classes may reduce retrieval usefulness for technical documentation.

---

## Headings

Section headings should be attached to subsequent content where appropriate.

This improves retrieval relevance and provides valuable context during prompt construction.

---

# Metadata Model

Every chunk is associated with descriptive metadata.

Example:

```json
{
  "document_id": "doc_123",
  "knowledge_base_id": "kb_01",
  "chunk_index": 8,
  "page": 12,
  "section": "Authentication",
  "source": "System_Design.pdf"
}
```

Metadata supports:

- Filtering
- Ranking
- Citations
- Traceability
- Future analytics

---

# Measuring Chunk Quality

Chunk quality should be evaluated using practical metrics rather than intuition.

Potential indicators include:

- Retrieval precision
- Retrieval recall
- Context completeness
- Duplicate retrieval rate
- Average prompt token usage
- User feedback

Future benchmarking will compare different chunking strategies across representative enterprise document sets.

---

# Future Enhancements

The chunking engine is designed to evolve with advances in AI and document processing.

Planned improvements include:

- Semantic chunking
- Adaptive chunk sizing
- Heading-aware chunking
- Table-aware chunking
- OCR-aware chunking
- Language-specific chunking
- Parent-child retrieval support
- Hierarchical chunk relationships

---

# Design Decisions

Several important architectural decisions shape the chunking system.

### Preserve Meaning Over Size

Semantic coherence is prioritised over maintaining exact character counts.

### Configuration Over Hardcoding

Chunk size and overlap should be configurable to support different use cases.

### Extensibility

New chunking strategies should be added without modifying existing implementations.

A strategy-based architecture enables experimentation while maintaining a stable API.

### Provider Independence

Chunk generation should remain independent of any specific embedding model or vector database.

---

# Summary

Chunking is one of the most critical stages of the Retrieval-Augmented Generation pipeline.

Rather than simply dividing text into fixed-size blocks, DocMinr.ai focuses on preserving semantic meaning, contextual continuity, and retrieval quality.

By supporting configurable strategies, metadata-rich chunks, and future semantic techniques, the platform establishes a strong foundation for accurate, scalable, and production-ready knowledge retrieval.
