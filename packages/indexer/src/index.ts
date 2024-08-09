import querystring from 'querystring';

let keepRunning: boolean = true;


const options = {
  version: 2,
  chain: 'optimism',
  endpoint: 'tokens',
  params : {
    type: 'ERC20'
  } 
};

const ercFetch = async () => {
  const host = `https://${options.chain}.blockscout.com`;
  const path = `api/v${options.version}/${options.endpoint}`;
  const query = querystring.stringify(options.params);
  const uri = `${host}/${path}?${query}`;
  console.log(uri);

  const response = await fetch(uri);
  const data = await response.json();
  console.log(data.items.length);

}


ercFetch();