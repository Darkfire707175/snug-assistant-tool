REVOKE ALL ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_game_result(text, numeric, boolean, integer, boolean) TO authenticated;