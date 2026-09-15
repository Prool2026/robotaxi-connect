import { redirect } from 'next/navigation';
import { brand } from '@/config/brand';
export default function Admin() {
  redirect(`/${brand.defaultLocale}/admin`);
}
