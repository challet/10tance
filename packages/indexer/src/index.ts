import 'dotenv/config';
import querystring from 'querystring';
import { Sequelize } from 'sequelize';
import { initDb, initModel } from '../../common/sequelize/index';
import computeLocation from '../../common/leaflet/EvmLocation';

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

  const response = await fetch(uri);
  const data = await response.json();

  await db.models.EVMObject.bulkCreate(data.items.map((d: any) => {
    const [lat, lng] = computeLocation(d.address);

    return {
      id: d.address.replace('Ox', '\\x'),
      latlng: db.fn('POINT', lng, lat),
      type: 'ERC20',
      meta: {
        symbol: d.symbol,
        name: d.name,
        icon_url: d.icon_url,
        circulating_market_cap: parseFloat(d.circulating_market_cap),
        holders: parseInt(d.holders)
      }
    };
  }));
  
  return data.next_page_params;
};