-- Add visibility and ordering to active_hunts
ALTER TABLE public.active_hunts 
ADD COLUMN IF NOT EXISTS is_visible_on_counter BOOLEAN DEFAULT true;

ALTER TABLE public.active_hunts 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Optional: Update existing hunts to have a default order
UPDATE public.active_hunts SET order_index = 0 WHERE order_index IS NULL;
