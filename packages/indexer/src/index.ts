import 'dotenv/config';
import querystring from 'querystring';
import { Sequelize } from 'sequelize';
import { initDb, initModel } from '../../common/sequelize/index';

(async () => {
  const db = await initDb();
  const EVMObject = initModel(db);

  const options = {
    version: 2,
    chain: 'optimism',
    endpoint: 'tokens',
    params : {
      type: 'ERC20'
    } 
  };
  
  let next_page_params = {};
  do {
    next_page_params = await erc20Fetch(db, { ...options, params: { ...options.params, ...next_page_params } });
  } while(next_page_params);
  
})();

async function erc20Fetch(db:Sequelize, options: any): Promise<any> {
  const host = `https://${options.chain}.blockscout.com`;
  const path = `api/v${options.version}/${options.endpoint}`;
  const query = querystring.stringify(options.params);
  const uri = `${host}/${path}?${query}`;
  console.log(uri);

  const response = await fetch(uri);
  const data = await response.json();
  console.log(data.items.length);

  await db.models.EVMObject.bulkCreate(data.items.map((d: any) => {
    const addr = BigInt(d.address);
    const lng = BigInt.asIntN(50, addr); // downscale the 80 bits to 50
    const lat = BigInt.asIntN(50, addr >> BigInt(80)); // shift 80 and downscale to 50 

    return {
      id: d.address.replace('Ox', '\\x'),
      latlng: db.fn('POINT', lng, lat),
      type: 'ERC20',
      meta: {
        name: d.symbol,
        icon_url: d.icon_url,
        circulating_market_cap: parseFloat(d.circulating_market_cap),
        holders: parseInt(d.holders)
      }
    };
  }));
  
  return data.next_page_params;
};