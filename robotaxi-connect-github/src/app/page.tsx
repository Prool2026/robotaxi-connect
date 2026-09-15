import { redirect } from 'next/navigation';
import { brand } from '@/config/brand';
export default function Home() {
  redirect(`/${brand.defaultLocale}`);
}
