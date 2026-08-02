import { HomeScreen } from "@/components/home-screen";

/**
 * この画面はサーバー処理を持たない静的な入れ物にしてある。
 * CDN から即座に返り、中身は端末側の控えを描いたあと Supabase を直接読む。
 */
export default function HomePage() {
  return <HomeScreen />;
}
