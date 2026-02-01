// Sport.Fun / Football.fun API client
// Uses Multicall3 for reliable single-call blockchain reads + player name mapping

import { ethers } from 'ethers'

// Contract addresses
export const SDF_CONTRACTS = {
  FUN_TOKEN: '0x16EE7ecAc70d1028E7712751E2Ee6BA808a7dd92',
  FDF_PLAYERS: '0x71c8b0c5148EdB0399D1EdF9BF0C8C81dEa16918',
  FDF_DEX: '0x9da1bb4e725acc0d96010b7ce2a7244cda446617',
  NFL_PLAYERS: '0x2EeF466e802Ab2835aB81BE63eEbc55167d35b56',
  NFL_DEX: '0x4fdce033b9f30019337ddc5cc028dc023580585e',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  MULTICALL3: '0xcA11bde05977b3631167028862bE2a173976CA11',
}

export const SDF_WALLET = '0xFc1A8921eA05bEC9ceb536f8aEE02AF881D72F6B'
const BASE_RPC = 'https://base.gateway.tenderly.co'
const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Player name mappings (from rykz data)
const FOOTBALL_PLAYERS: Record<string, string> = {
  '550864': 'Leny Yoro', '212769': 'Unai Simón', '220566': 'Rodrigo Hernández', '195851': 'Scott McTominay',
  '521052': 'Daniel Svensson', '171387': 'Manuel Locatelli', '93661': 'Giovanni Di Lorenzo', '220325': 'Jules Koundé',
  '224919': 'Robin Le Normand', '443661': 'Michael Olise', '544877': 'Milos Kerkez', '467169': 'Antony',
  '106004': 'Alejandro Grimaldo', '432720': 'James Trafford', '438234': 'Omar Marmoush', '244855': 'Jude Bellingham',
  '129487': 'Mike Maignan', '465206': 'Nuno Mendes', '224117': 'Viktor Gyökeres', '223255': 'Federico Valverde',
  '520250': 'Arda Güler', '437922': 'Angelo Stiller', '219168': 'Alexander Isak', '81352': 'Jan Oblak',
  '547103': 'Kenan Yildiz', '461358': 'Julián Alvarez', '487606': 'Strahinja Pavlovic', '199432': 'Denzel Dumfries',
  '184254': 'Guglielmo Vicario', '511505': 'Matías Soulé', '421821': 'Jonathan David', '430871': 'Matheus Cunha',
  '165196': 'Amir Rrahmani', '201379': 'Fabián Ruiz', '437858': 'Vitinha', '184029': 'Martin Ødegaard',
  '214225': 'Joe Rodon', '141746': 'Bruno Fernandes', '204480': 'Declan Rice', '441428': 'Jarell Quansah',
  '221632': 'Cristian Romero', '441164': 'Pedro Porro', '215379': 'Elliot Anderson', '97032': 'Virgil van Dijk',
  '220160': 'Kylian Mbappé', '199661': 'Dayot Upamecano', '209737': 'Lautaro Martínez', '230650': 'Michele Di Gregorio',
  '164454': 'Jonathan Tah', '440668': 'Khvicha Kvaratskhelia', '497894': 'Rasmus Højlund', '462424': 'William Saliba',
  '555894': 'Maghnes Akliouche', '172649': 'Dean Henderson', '216065': 'Rafael Leão', '218543': 'Exequiel Palacios',
  '209244': 'Phil Foden', '171314': 'Rúben Dias', '178301': 'Ollie Watkins', '478960': 'Wilfried Singo',
  '199798': 'Ezri Konsa', '493250': 'Amad Diallo', '219265': 'Felix Nmecha', '486672': 'Moisés Caicedo',
  '225485': 'Jonathan Burkardt', '477424': 'Josko Gvardiol', '169187': 'Trent Alexander-Arnold', '446008': 'Bryan Mbeumo',
  '222531': 'Morgan Gibbs-White', '449928': 'Joan García', '466052': 'Rayan Cherki', '179268': 'Marc Cucurella',
  '209036': 'Marc Guéhi', '246333': 'Vinícius Jr.', '215977': 'Alessandro Bastoni', '223340': 'Bukayo Saka',
  '176297': 'Marcus Rashford', '453750': 'Karim Adeyemi', '490541': 'Pedri', '551150': 'João Neves',
  '78830': 'Harry Kane', '441266': 'Ryan Gravenberch', '593110': 'Pau Cubarsí', '593109': 'Lamine Yamal',
  '219438': 'Ousmane Dembélé', '554605': 'Dean Huijsen', '85633': 'Matz Sels', '111234': 'Jordan Pickford',
  '116535': 'Alisson', '219961': 'Raphinha', '244851': 'Cole Palmer', '218449': 'Éder Militão',
  '133798': 'Serge Gnabry', '424969': 'Edmond Tapsoba', '220688': 'Mason Greenwood', '570810': 'Désiré Doué',
  '248875': 'Jérémy Doku', '485335': 'Lucas Chevalier', '445122': 'Jurriën Timber', '226597': 'Gabriel Magalhães',
  '159506': 'Ola Aina', '448047': 'Enzo Fernández', '98980': 'Emiliano Martínez', '223094': 'Erling Haaland',
  '519322': 'Jobe Bellingham', '154561': 'David Raya', '460842': 'Mohammed Kudus', '179370': 'Dani Olmo',
  '515501': 'Álvaro Carreras', '106921': 'Gerónimo Rulli', '132015': 'Pierre-Emile Højbjerg', '432422': 'Sandro Tonali',
  '247632': 'Pedro Neto', '185513': 'Gregor Kobel', '66749': 'Romelu Lukaku', '475168': 'João Pedro',
  '493362': 'Xavi Simons', '510663': 'Hugo Ekitiké', '232413': 'Eberechi Eze', '171384': 'Nicolò Barella',
  '176413': 'Christian Pulisic', '118748': 'Mohamed Salah', '60772': 'Thibaut Courtois', '98747': 'Nick Pope',
  '162275': 'Serhou Guirassy', '165687': 'Joshua Kimmich', '244731': 'Luis Díaz', '204335': 'Maximilian Mittelstädt',
  '61366': 'Kevin De Bruyne', '126551': 'Alessio Romagnoli', '470313': 'Nick Woltemade', '118342': 'Mark Flekken',
  '466006': 'Malik Tillman', '204936': 'Gianluigi Donnarumma', '494595': 'Florian Wirtz', '223760': 'Achraf Hakimi',
  '215059': 'Robert Sánchez', '470836': 'Nico Schlotterbeck', '111732': 'Hakan Çalhanoğlu', '20388': 'Manuel Neuer',
}

// ABIs
const MULTICALL_ABI = ['function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])']
const ERC1155_ABI = ['function balanceOf(address account, uint256 id) view returns (uint256)']
const ERC20_ABI = ['function balanceOf(address account) view returns (uint256)']
const DEX_ABI = ['function currencyReservesByPlayerId(uint256 playerId) view returns (uint256)']

export interface TokenBalance {
  symbol: string
  name: string
  balance: string
  balanceFormatted: number
  decimals: number
  contractAddress: string
  priceUsd?: number
  valueUsd?: number
}

export interface PlayerShare {
  tokenId: string
  contractAddress: string
  balance: string
  balanceFormatted: number
  gameType: 'FDF' | 'NFL'
  playerName?: string
  imageUrl?: string
  priceUsd?: number
  valueUsd?: number
  poolLiquidity?: number
}

export interface SDFPortfolio {
  wallet: string
  funToken: TokenBalance | null
  usdcBalance: TokenBalance | null
  playerShares: PlayerShare[]
  totalFunValue: number
  totalPlayersValue: number
  totalPortfolioValue: number
  lastUpdated: Date
}

// Fetch $FUN token price
export async function fetchFunPrice(): Promise<number> {
  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/token_price/base?contract_addresses=${SDF_CONTRACTS.FUN_TOKEN.toLowerCase()}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    )
    if (!response.ok) return 0
    const data = await response.json()
    return data[SDF_CONTRACTS.FUN_TOKEN.toLowerCase()]?.usd || 0
  } catch (error) {
    console.error('Error fetching FUN price:', error)
    return 0
  }
}

// Fetch complete SDF portfolio using Multicall
export async function fetchSDFPortfolio(wallet: string = SDF_WALLET): Promise<SDFPortfolio> {
  try {
    const provider = new ethers.JsonRpcProvider(BASE_RPC)
    const multicall = new ethers.Contract(SDF_CONTRACTS.MULTICALL3, MULTICALL_ABI, provider)
    const playerIface = new ethers.Interface(ERC1155_ABI)
    const tokenIface = new ethers.Interface(ERC20_ABI)
    const dexIface = new ethers.Interface(DEX_ABI)
    
    const playerIds = Object.keys(FOOTBALL_PLAYERS)
    
    // Build multicall: FUN balance + USDC balance + all player balances
    const calls = [
      // FUN token balance
      { target: SDF_CONTRACTS.FUN_TOKEN, allowFailure: true, callData: tokenIface.encodeFunctionData('balanceOf', [wallet]) },
      // USDC balance
      { target: SDF_CONTRACTS.USDC, allowFailure: true, callData: tokenIface.encodeFunctionData('balanceOf', [wallet]) },
      // All player balances
      ...playerIds.map(id => ({
        target: SDF_CONTRACTS.FDF_PLAYERS,
        allowFailure: true,
        callData: playerIface.encodeFunctionData('balanceOf', [wallet, id])
      }))
    ]
    
    const results = await multicall.aggregate3.staticCall(calls)
    
    // Parse FUN balance
    let funBalance = 0n
    if (results[0][0] && results[0][1] !== '0x') {
      try { funBalance = tokenIface.decodeFunctionResult('balanceOf', results[0][1])[0] } catch {}
    }
    
    // Parse USDC balance
    let usdcBalance = 0n
    if (results[1][0] && results[1][1] !== '0x') {
      try { usdcBalance = tokenIface.decodeFunctionResult('balanceOf', results[1][1])[0] } catch {}
    }
    
    // Find players with non-zero balances
    const holdings: { id: string; balance: bigint }[] = []
    for (let i = 0; i < playerIds.length; i++) {
      const r = results[i + 2]
      if (r[0] && r[1] !== '0x') {
        try {
          const balance = playerIface.decodeFunctionResult('balanceOf', r[1])[0]
          if (balance > 0n) {
            holdings.push({ id: playerIds[i], balance })
          }
        } catch {}
      }
    }
    
    // Get prices for holdings
    const playerShares: PlayerShare[] = []
    let totalPlayersValue = 0
    
    if (holdings.length > 0) {
      const priceCalls = holdings.flatMap(h => [
        { target: SDF_CONTRACTS.FDF_DEX, allowFailure: true, callData: dexIface.encodeFunctionData('currencyReservesByPlayerId', [h.id]) },
        { target: SDF_CONTRACTS.FDF_PLAYERS, allowFailure: true, callData: playerIface.encodeFunctionData('balanceOf', [SDF_CONTRACTS.FDF_DEX, h.id]) }
      ])
      
      const priceResults = await multicall.aggregate3.staticCall(priceCalls)
      
      for (let i = 0; i < holdings.length; i++) {
        const h = holdings[i]
        const currRes = priceResults[i * 2]
        const tokRes = priceResults[i * 2 + 1]
        
        let currencyReserve = 0n, tokenReserve = 0n
        if (currRes[0] && currRes[1] !== '0x') {
          try { currencyReserve = dexIface.decodeFunctionResult('currencyReservesByPlayerId', currRes[1])[0] } catch {}
        }
        if (tokRes[0] && tokRes[1] !== '0x') {
          try { tokenReserve = playerIface.decodeFunctionResult('balanceOf', tokRes[1])[0] } catch {}
        }
        
        let priceUsd = 0
        if (tokenReserve > 0n) {
          priceUsd = Number((currencyReserve * BigInt(1e18)) / tokenReserve) / 1e6
        }
        
        const balanceFormatted = Number(h.balance) / 1e18
        const valueUsd = balanceFormatted * priceUsd
        totalPlayersValue += valueUsd
        
        playerShares.push({
          tokenId: h.id,
          contractAddress: SDF_CONTRACTS.FDF_PLAYERS,
          balance: h.balance.toString(),
          balanceFormatted,
          gameType: 'FDF',
          playerName: FOOTBALL_PLAYERS[h.id] || `Player #${h.id}`,
          priceUsd,
          valueUsd,
          poolLiquidity: Number(currencyReserve) / 1e6
        })
      }
      
      // Sort by value
      playerShares.sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0))
    }
    
    // Get FUN price
    const funPrice = await fetchFunPrice()
    const funBalanceFormatted = Number(funBalance) / 1e18
    const funValue = funBalanceFormatted * funPrice
    const usdcBalanceFormatted = Number(usdcBalance) / 1e6
    
    return {
      wallet,
      funToken: {
        symbol: 'FUN',
        name: 'Sport.fun Token',
        balance: funBalance.toString(),
        balanceFormatted: funBalanceFormatted,
        decimals: 18,
        contractAddress: SDF_CONTRACTS.FUN_TOKEN,
        priceUsd: funPrice,
        valueUsd: funValue
      },
      usdcBalance: {
        symbol: 'USDC',
        name: 'USD Coin',
        balance: usdcBalance.toString(),
        balanceFormatted: usdcBalanceFormatted,
        decimals: 6,
        contractAddress: SDF_CONTRACTS.USDC,
        priceUsd: 1,
        valueUsd: usdcBalanceFormatted
      },
      playerShares,
      totalFunValue: funValue,
      totalPlayersValue,
      totalPortfolioValue: funValue + usdcBalanceFormatted + totalPlayersValue,
      lastUpdated: new Date()
    }
  } catch (error) {
    console.error('Error fetching SDF portfolio:', error)
    return {
      wallet,
      funToken: null,
      usdcBalance: null,
      playerShares: [],
      totalFunValue: 0,
      totalPlayersValue: 0,
      totalPortfolioValue: 0,
      lastUpdated: new Date()
    }
  }
}
