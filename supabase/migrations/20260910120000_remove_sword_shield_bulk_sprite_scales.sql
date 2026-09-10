-- Remove the overrides inserted by the removed Sword/Shield bulk-scale action.
-- Sprite sizes can then be adjusted again through the per-sprite editor.
DELETE FROM public.sprite_scale_overrides
WHERE sprite_url LIKE '/api/game-sprite?file=Spr_8s_%'
  AND scale = 1.90;
