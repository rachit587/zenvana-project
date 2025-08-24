export const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const formatIndianCurrency = (num) => {
  if (typeof num !== 'number') num = parseFloat(num || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num);
};

export const getAge = (dateString) => {
  if (!dateString) return 30;
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};
