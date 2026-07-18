"""
Manual Chunking Implementation
Our custom chunker to understand the process
"""
import re
from typing import List
from .config import config

class ManualChunker:
    """Manual implementation of text chunking"""
    
    def __init__(
        self,
        chunk_size: int = None,
        chunk_overlap: int = None,
        separators: List[str] = None,
    ):
        self.chunk_size = chunk_size or config.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or config.CHUNK_OVERLAP
        self.separators = separators or config.SEPARATORS
        self.min_chunk_size = config.MIN_CHUNK_SIZE
    
    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks using manual logic
        
        Steps:
        1. Try splitting by each separator (paragraphs first)
        2. Ensure chunks don't exceed chunk_size
        3. Add overlap between chunks
        4. Filter out empty chunks
        """
        if not text:
            return []
        
        # Step 1: Normalize text
        text = text.strip()
        
        # Step 2: Try splitting by separators
        chunks = self._split_by_separators(text)
        
        # Step 3: Ensure chunks don't exceed max size
        final_chunks = []
        for chunk in chunks:
            if len(chunk) <= self.chunk_size:
                final_chunks.append(chunk)
            else:
                # Split into smaller chunks
                sub_chunks = self._split_large_chunk(chunk)
                final_chunks.extend(sub_chunks)
        
        # Step 4: Add overlap between chunks
        final_chunks = self._add_overlap(final_chunks)
        
        # Step 5: Filter out empty/small chunks
        final_chunks = [
            chunk for chunk in final_chunks 
            if len(chunk) >= self.min_chunk_size
        ]
        
        return final_chunks
    
    def _split_by_separators(self, text: str) -> List[str]:
        """Recursively split text by separators"""
        chunks = [text]
        
        for separator in self.separators:
            if separator == "":
                break
            
            new_chunks = []
            for chunk in chunks:
                if len(chunk) <= self.chunk_size:
                    new_chunks.append(chunk)
                else:
                    parts = chunk.split(separator)
                    # Re-add the separator for better context
                    parts = [part + separator for part in parts if part]
                    new_chunks.extend(parts)
            
            chunks = new_chunks
            
            # If all chunks are small enough, stop
            if all(len(c) <= self.chunk_size for c in chunks):
                break
        
        # Final cleaning
        cleaned_chunks = []
        for chunk in chunks:
            chunk = chunk.strip()
            if chunk:
                cleaned_chunks.append(chunk)
        
        return cleaned_chunks
    
    def _split_large_chunk(self, chunk: str) -> List[str]:
        """Split a large chunk into smaller pieces"""
        parts = []
        while len(chunk) > self.chunk_size:
            # Split by the last separator within chunk_size
            split_point = self._find_split_point(chunk[:self.chunk_size])
            if split_point == 0:
                # No separator found, split at chunk_size
                split_point = self.chunk_size
            
            parts.append(chunk[:split_point].strip())
            chunk = chunk[split_point:].strip()
        
        if chunk:
            parts.append(chunk)
        
        return parts
    
    def _find_split_point(self, text: str) -> int:
        """Find the best place to split text"""
        # Try to find a separator
        for separator in self.separators:
            if separator == "":
                break
            last_index = text.rfind(separator)
            if last_index > 0:
                return last_index + len(separator)
        return len(text)
    
    def _add_overlap(self, chunks: List[str]) -> List[str]:
        """Add overlap between chunks for context"""
        if len(chunks) <= 1:
            return chunks
        
        overlapped_chunks = []
        overlap_len = self.chunk_overlap
        
        for i, chunk in enumerate(chunks):
            if i == 0:
                # First chunk: keep as is
                overlapped_chunks.append(chunk)
            else:
                # Add overlap from previous chunk
                prev_chunk = chunks[i - 1]
                overlap_text = prev_chunk[-overlap_len:] if len(prev_chunk) >= overlap_len else prev_chunk
                overlapped_chunks.append(overlap_text + chunk)
        
        return overlapped_chunks