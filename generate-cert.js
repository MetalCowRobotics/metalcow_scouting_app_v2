const selfsigned = require('selfsigned');
const fs = require('fs');

async function generate() {
  const attrs = [
    { name: 'CN', value: 'localhost' },
    { name: 'C', value: 'US' },
    { name: 'ST', value: 'State' },
    { name: 'L', value: 'City' },
    { name: 'O', value: 'Organization' }
  ];
  const pems = await selfsigned.generate(attrs, { days: 365 });

  console.log(pems);

  fs.writeFileSync('key.pem', pems.private);
  fs.writeFileSync('cert.pem', pems.cert);
}

generate();