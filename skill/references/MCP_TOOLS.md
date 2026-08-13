# Reelora MCP Tool Mapping

When the following tools are available, use them instead of pretending to render video inside plain chat.

## `reelora_features`

Use to inspect the backend feature registry and version.

## `reelora_analyze`

Use for raw-footage inspection. Pass uploaded/mounted paths plus optional highlight and vision observations.

## `reelora_edit`

Primary automatic editing tool. Pass raw videos, required outro, optional supplied music, highlight intent, optional duration, and advanced options.

For `top_wear`, the default distribution is 70% focus, 20% whole body, 10% detail unless the user explicitly provides another percentage split.

## `reelora_variants`

Use when the user wants differentiated A/B versions. The backend creates premium, fast-ecommerce, and luxury variants using the same preserved source footage.

## `reelora_batch_edit`

Use when the user provides multiple independent product jobs. Keep each product's media isolated from the other jobs.

## `reelora_save_brand_profile`

Use when the user explicitly wants reusable editing preferences saved in the Reelora backend.

## `reelora_list_brand_profiles`

Use to inspect saved backend profiles.

## Vision observations

A vision-capable layer may supply structured observations with:

- source index
- timestamp
- product region
- face/full-body/hand regions
- pose
- variant
- product visibility
- occlusion
- blur
- confidence

These observations are metadata only. The renderer uses them to choose/crop original source pixels and never generates replacement product/model content.
