import { useState, useEffect } from 'react';
import { getUsdToMxn } from '../utils/banxico';

export function useCurrency() {
  const [usdToMxn, setUsdToMxn] = useState(null);

  useEffect(() => {
    getUsdToMxn().then(setUsdToMxn);
  }, []);

  return usdToMxn;
}
