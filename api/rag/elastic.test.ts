import { describe, expect, test } from "bun:test"
import { getFileIdentity, isCompleteIndexedFileVersion } from "./elastic"

describe("RAG Elasticsearch helpers", () => {
  test("identifies a complete file version from its expected chunk count", () => {
    expect(isCompleteIndexedFileVersion(12, 12)).toBe(true)
    expect(isCompleteIndexedFileVersion(11, 12)).toBe(false)
    expect(isCompleteIndexedFileVersion(0, 0)).toBe(false)
  })

  test("scopes incremental checksum identities to publication and file key", () => {
    expect(getFileIdentity("record-1", "paper.pdf")).not.toBe(getFileIdentity("record-2", "paper.pdf"))
  })
})
