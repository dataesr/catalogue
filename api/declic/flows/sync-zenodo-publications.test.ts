import { describe, expect, test } from "bun:test"
import { normalizeZenodoPublication } from "./sync-zenodo-publications"

describe("normalizeZenodoPublication", () => {
  test("preserves Zenodo file IDs and checksums in the catalogue document", () => {
    const publication = normalizeZenodoPublication({
      id: 456,
      metadata: { title: "Publication" },
      files: [
        {
          id: "zenodo-file-uuid",
          key: "publication.pdf",
          size: 1234,
          checksum: "md5:abc123",
          links: { self: "https://zenodo.org/api/files/zenodo-file-uuid" },
        },
      ],
    })

    expect(publication.files).toEqual([
      {
        id: "zenodo-file-uuid",
        key: "publication.pdf",
        size: 1234,
        url: "https://zenodo.org/api/files/zenodo-file-uuid",
        type: "pdf",
        checksum: "md5:abc123",
      },
    ])
  })
})
