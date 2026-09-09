export function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento + "T00:00:00");
  if (Number.isNaN(nasc.getTime())) return NaN;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export const ehMenorDeIdade = (dataNascimento: string) => {
  const idade = calcularIdade(dataNascimento);
  return !Number.isNaN(idade) && idade < 18;
};
