// Node.js only script - runs via: pnpm update-endpoints
// Using ES modules syntax
import fs from "fs";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load rpc-networks.json using ES modules
const rpcNetworksData = JSON.parse(readFileSync(path.join(__dirname, "./rpc-networks.json"), "utf8"));
const { rpcNetworks } = rpcNetworksData;

const URL = "https://chains.hyperquery.xyz/active_chains";

const RENAME_CONFIG = {
    "eth": "Ethereum Mainnet",
    "polygon-zkevm": "Polygon zkEVM",
    "zksync": "ZKsync",
    // Add other renaming rules here
};

// Filter out staging and fuel chains
const FILTER_ENDPOINTS = [/^staging-/, /fuel/, /temporary/, /delete/];

const TICK = "✔️";

const capitalizeAndSplit = (name) => {
  return name.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const sortAndFilterChains = (data) => {
  return data
    .sort((a, b) => {
      const nameA = RENAME_CONFIG[a.name] || capitalizeAndSplit(a.name);
      const nameB = RENAME_CONFIG[b.name] || capitalizeAndSplit(b.name);
      return nameA.localeCompare(nameB);
    })
    .filter(
      (chain) => !FILTER_ENDPOINTS.some((regex) => regex.test(chain.name))
    );
};

const getNetworkName = (chain) =>
  RENAME_CONFIG[chain.name] || capitalizeAndSplit(chain.name);

const emojiTier = (network) => {
  return (
    {
      gold: "🏅",
      silver: "🥈",
      bronze: "🥉",
      stone: "🪨",
      hidden: "🔒",
      testnet: "🎒",
    }[network.tier.toLowerCase()] || "🏗️"
  );
};

// Generate HyperSync table for MDX (using Card component)
const generateHyperSyncMDXTable = (data) => {
  const sortedChains = sortAndFilterChains(data);
  
  let tableRows = "";
  sortedChains.forEach((chain) => {
    const networkName = getNetworkName(chain);
    const tier = emojiTier(chain);
    const supportsTraces =
      chain.additional_features && chain.additional_features.includes("TRACES")
        ? TICK
        : "";
    
    const isTracesNetwork = chain.name.toLowerCase().includes("traces");
    const chainIdSuffix = isTracesNetwork ? `-traces` : "";
    const url = `https://${chain.name}.hypersync.xyz or https://${chain.chain_id}${chainIdSuffix}.hypersync.xyz`;

    tableRows += `| ${networkName} | ${chain.chain_id} | ${url} | ${tier} | ${supportsTraces} |\n`;
  });

  return `<Card>
| Network Name | Network ID | URL | Tier | Supports Traces |
| --- | --- | --- | --- | --- |
${tableRows}</Card>`;
};

// Generate HyperRPC table for MDX (using Card component)
const generateHyperRPCMDXTable = (data) => {
  const sortedChains = sortAndFilterChains(data);
  
  let tableRows = "";
  sortedChains.forEach((chain) => {
    const networkName = getNetworkName(chain);
    const isTracesNetwork = chain.name.toLowerCase().includes("traces");
    const chainIdSuffix = isTracesNetwork ? `-traces` : "";
    const url = `https://${chain.name}.rpc.hypersync.xyz or https://${chain.chain_id}${chainIdSuffix}.rpc.hypersync.xyz`;

    tableRows += `| ${networkName} | ${chain.chain_id} | ${url} |\n`;
  });

  return `<Card>
| Network Name | Network ID | URL |
| --- | --- | --- |
${tableRows}</Card>`;
};

// Update HyperSync supported networks MDX file
const updateHyperSyncMarkdownFile = async () => {
  try {
    const response = await fetch(URL);
    const data = await response.json();

    const hyperSyncTable = generateHyperSyncMDXTable(data);
    const HYPERSYNC_FILE_PATH = path.join(
      __dirname,
      "../HyperSync/hypersync-supported-networks.mdx"
    );

    const frontmatter = `---
title: Supported Networks
description: Discover all networks currently supported by HyperSync
---

<Note>
We are rapidly adding new supported networks. If you don't see your network here or would like us to add a network to HyperSync, pop us a message in our [Discord](https://discord.gg/Q9qt8gZ2fX).
</Note>

<Info>
The Tier is the level of support (and therefore reliability) based on the infrastructure running the chain. We are actively working to make the tier distinctions more clear and transparent to our users.

Currently, tiers relate to various service quality aspects including:

- Allocated resources and compute power
- Query processing speed
- Infrastructure redundancy
- Backup frequency and retention
- Multi-region availability
- Priority for upgrades and new features
- SLA guarantees

While detailed tier specifications are still being finalized, we're committed to providing transparent service level information in the near future.

If you are a network operator or user and would like improved service support or to discuss upgrading a chain's level of support, please reach out to us in [Discord](https://discord.gg/Q9qt8gZ2fX).
</Info>

<div style={{display: 'flex', justifyContent: 'center'}}>
${hyperSyncTable}
</div>
`;

    fs.writeFileSync(HYPERSYNC_FILE_PATH, frontmatter, "utf8");
    console.log("HyperSync markdown file updated successfully.");
  } catch (error) {
    console.error("Error updating HyperSync markdown file:", error);
  }
};

// Update HyperRPC supported networks MDX file
const updateHyperRPCMarkdownFile = async () => {
  try {
    const response = await fetch(URL);
    const data = await response.json();

    const hyperRPCTable = generateHyperRPCMDXTable(data);
    const HYPERRPC_FILE_PATH = path.join(
      __dirname,
      "../HyperRPC/hyperrpc-supported-networks.mdx"
    );

    let hyperRPCContent = fs.readFileSync(HYPERRPC_FILE_PATH, "utf8");

    // Find and replace the Card table section
    const hyperRPCRegex =
      /(<div style=\{\{display: 'flex', justifyContent: 'center'\}\}>\s*<Card>)[\s\S]*?(<\/Card>\s*<\/div>)/;
    const hyperRPCMatch = hyperRPCContent.match(hyperRPCRegex);

    if (hyperRPCMatch) {
      const updatedHyperRPCContent = hyperRPCContent.replace(
        hyperRPCRegex,
        `<div style={{display: 'flex', justifyContent: 'center'}}>\n${hyperRPCTable}\n</div>`
      );
      fs.writeFileSync(HYPERRPC_FILE_PATH, updatedHyperRPCContent, "utf8");
      console.log("HyperRPC markdown file updated successfully.");
    } else {
      console.log("HyperRPC table not found in the markdown file.");
    }
  } catch (error) {
    console.error("Error updating HyperRPC markdown file:", error);
  }
};

// Function to generate MDX content for HyperIndex network pages
const generateHyperSyncMarkdownContent = (network) => {
  const capitalizedTitle = getNetworkName(network);
  const tier = emojiTier(network);

  const isTracesNetwork = network.name.toLowerCase().includes("traces");
  const chainIdSuffix = isTracesNetwork ? `-traces` : "";
  const hypersyncUrl1 = `https://${network.name}.hypersync.xyz`;
  const hypersyncUrl2 = `https://${network.chain_id}${chainIdSuffix}.hypersync.xyz`;
  const hyperrpcUrl1 = `https://${network.name}.rpc.hypersync.xyz`;
  const hyperrpcUrl2 = `https://${network.chain_id}${chainIdSuffix}.rpc.hypersync.xyz`;

  return `---
title: ${capitalizedTitle}
description: Index ${capitalizedTitle} data using Envio HyperIndex
---

## Indexing ${capitalizedTitle} Data with Envio

<div style={{display: 'flex', justifyContent: 'center'}}>
<Card style={{backgroundColor: '#f9fafb'}}>
| **Field** | **Value** |
| --- | --- |
| **${capitalizedTitle} Chain ID** | ${network.chain_id} |
| **Tier** | ${network.tier} ${tier} |
| **HyperSync URL Endpoint** | [${hypersyncUrl1}](${hypersyncUrl1}) or [${hypersyncUrl2}](${hypersyncUrl2}) |
| **HyperRPC URL Endpoint** | [${hyperrpcUrl1}](${hyperrpcUrl1}) or [${hyperrpcUrl2}](${hyperrpcUrl2}) |
</Card>
</div>

### Overview

Envio is a modular hyper-performant data indexing solution for ${capitalizedTitle}, enabling applications and developers to efficiently index and aggregate real-time and historical blockchain data. Envio offers three primary solutions for indexing and accessing large amounts of data: [HyperIndex](/HyperIndex/Introduction/overview) (a customizable indexing framework), [HyperSync](/HyperSync/overview) (a real-time indexed data layer), and [HyperRPC](/HyperRPC/overview) (extremely fast read-only RPC).

HyperSync accelerates the synchronization of historical data on ${capitalizedTitle}, enabling what usually takes hours to sync millions of events to be completed in under a minute—up to 2000x faster than traditional RPC methods.

Designed to optimize the user experience, Envio offers automatic code generation, flexible language support, multi-chain data aggregation, and a reliable, cost-effective hosted service.

To get started, see our documentation or follow our quickstart [guide](/HyperIndex/Introduction/contract-import).

### Defining Network Configurations

\`\`\`yaml icon="/icons/yaml-icon.png" title="config.yaml"
name: IndexerName # Specify indexer name
description: Indexer Description # Include indexer description
networks:
  - id: ${network.chain_id} # ${capitalizedTitle}  
    start_block: START_BLOCK_NUMBER  # Specify the starting block
    contracts:
      - name: ContractName
        address:
         - "0xYourContractAddress1"
         - "0xYourContractAddress2"
        handler: ./src/EventHandlers.ts
        events:
          - event: Event # Specify event
          - event: Event
\`\`\`

With these steps completed, your application will be set to efficiently index ${capitalizedTitle} data using Envio's blockchain indexer.

For more information on how to set up your config, define a schema, and write event handlers, refer to the guides section in our [documentation](/HyperIndex/Guides/configuration-file).

### Support

Can't find what you're looking for or need support? Reach out to us on [Discord](https://discord.com/invite/Q9qt8gZ2fX); we're always happy to help!
`;
};

const sluggifyName = (network) => {
  return network.name.toLowerCase().replace(/\s+/g, "-");
};

// Function to generate MDX content for RPC networks
const generateRPCMarkdownContent = (network) => {
  let slugFriendlyName = sluggifyName(network);

  return `---
title: ${network.name}
description: Index ${network.name} data using Envio HyperIndex via RPC
---

## Indexing ${network.name} Data with Envio via RPC

<Warning>
RPC as a source is not as fast as HyperSync. It is important in production to source RPC data from reliable sources. We recommend our partners at [drpc.org](https://drpc.org). Below, we have provided a set of free endpoints sourced from chainlist.org. **We don't recommend using these in production** as they may be rate limited. We recommend [tweaking the RPC config](/HyperIndex/Advanced/rpc-sync) to accommodate potential rate limiting.
</Warning>

We suggest getting the latest from [chainlist.org](https://chainlist.org).

### Overview

Envio supports ${network.name} through an RPC-based indexing approach. This method allows you to ingest blockchain data via an RPC endpoint by setting the RPC configuration.

### Defining Network Configurations

To use ${network.name}, define the RPC configuration in your network configuration file as follows:

<Callout icon="info-circle" color="#3B82F6" iconType="regular">
You may need to adjust more parameters of the [RPC configuration](/HyperIndex/Advanced/rpc-sync) to support the specific RPC provider.
</Callout>

\`\`\`yaml icon="/icons/yaml-icon.png" title="config.yaml"
name: IndexerName # Specify indexer name
description: Indexer Description # Include indexer description
networks:
  - id: ${network.chainId} # ${network.name}
    rpc_config:
      url: ${network.rpcEndpoints[0]} ${
    network.rpcEndpoints.length <= 1
      ? ""
      : network.rpcEndpoints
          .slice(1)
          .map((url) => `\n    # url: ${url} # alternative`)
          .join("")
  }
    start_block: START_BLOCK_NUMBER # Specify the starting block
    contracts:
      - name: ContractName
        address:
          - "0xYourContractAddress1"
          - "0xYourContractAddress2"
        handler: ./src/EventHandlers.ts
        events:
          - event: Event # Specify event
          - event: Event
\`\`\`

Want HyperSync for ${network.name}? Request network support here [Discord](https://discord.gg/fztEvj79m3)!
`;
};

// Function to generate markdown files for each network
const generateMarkdownFiles = async () => {
  try {
    const response = await fetch(URL);
    const data = await response.json();

    // Directory where the markdown files will be saved
    const outputDir = path.join(
      __dirname,
      "../HyperIndex/supported-networks"
    );

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Special pages that should appear at the top
    let supportedNetworks = [
      "HyperIndex/supported-networks/index",
      "HyperIndex/supported-networks/any-evm-with-rpc",
      "HyperIndex/supported-networks/local-anvil",
      "HyperIndex/supported-networks/local-hardhat",
    ];
    const generatedFileNames = new Set(['index', 'any-evm-with-rpc', 'local-anvil', 'local-hardhat']); // Track generated file names to avoid duplicates

    // Generate HyperSync files
    data.forEach((network) => {
      if (
        network.tier.toLowerCase() !== "hidden" &&
        network.tier.toLowerCase() !== "internal" &&
        !network.name.toLowerCase().includes("traces") // Exclude traces networks from HyperIndex docs
      ) {
        const fileName = network.name;
        if (generatedFileNames.has(fileName)) {
          console.log(`Skipping duplicate file: ${fileName}`);
          return;
        }
        generatedFileNames.add(fileName);
        const content = generateHyperSyncMarkdownContent(network);
        const filePath = path.join(outputDir, `${fileName}.mdx`);
        fs.writeFileSync(filePath, content, "utf8");
        supportedNetworks.push(
          `HyperIndex/supported-networks/${fileName}`
        );
        console.log(`Generated file: ${filePath}`);
      }
    });

    // Generate RPC files
    rpcNetworks.forEach((network) => {
      // if network.chainId exists in data, skip it, implies it's now supported in hypersync
      if (data.find((item) => item.chain_id === network.chainId)) {
        return;
      }
      const slugName = sluggifyName(network);
      if (generatedFileNames.has(slugName)) {
        console.log(`Skipping duplicate file: ${slugName}`);
        return;
      }
      generatedFileNames.add(slugName);
      const content = generateRPCMarkdownContent(network);
      const filePath = path.join(outputDir, `${slugName}.mdx`);
      fs.writeFileSync(filePath, content, "utf8");
      supportedNetworks.push(
        `HyperIndex/supported-networks/${slugName}`
      );
      console.log(`Generated file: ${filePath}`);
    });

    // Sort networks alphabetically (keeping special pages first)
    const specialPages = supportedNetworks.slice(0, 4); // index, any-evm-with-rpc, local-anvil, local-hardhat
    const otherNetworks = supportedNetworks.slice(4).sort();
    supportedNetworks = [...specialPages, ...otherNetworks];

    console.log(`\nGenerated ${supportedNetworks.length - 4} network files (excluding special pages).`);
    console.log(`Total pages in Supported Networks section: ${supportedNetworks.length}`);

    return supportedNetworks;
  } catch (error) {
    console.error("Error generating markdown files:", error);
    return [];
  }
};

// Function to ensure all groups have expanded property in correct order
const ensureAllGroupsExpanded = (tabs) => {
  tabs.forEach(tab => {
    if (tab.groups && Array.isArray(tab.groups)) {
      tab.groups.forEach((group, index) => {
        // Remove old collapse property if it exists
        if (group.collapse !== undefined) {
          delete group.collapse;
        }
        
        // Set expanded property: false for Supported Networks, true for others
        const expandedValue = group.group === "Supported Networks" ? false : true;
        
        // Reorder properties: group, expanded, pages
        if (group.group && group.pages) {
          const { group: groupName, pages, ...rest } = group;
          const reorderedGroup = {
            group: groupName,
            expanded: expandedValue,
            pages: pages,
            ...rest
          };
          // Replace the group in the array
          tab.groups[index] = reorderedGroup;
        } else if (group.group) {
          // If expanded doesn't exist, add it
          if (group.expanded === undefined) {
            group.expanded = expandedValue;
          }
        }
      });
    }
  });
};

// Function to update docs.json with the network entries
const updateDocsJson = (networkPages) => {
  try {
    const docsJsonPath = path.join(__dirname, "../docs.json");
    const docsJsonContent = fs.readFileSync(docsJsonPath, "utf8");
    const docsJson = JSON.parse(docsJsonContent);

    // Ensure all groups have expanded property set correctly
    ensureAllGroupsExpanded(docsJson.navigation.tabs);

    // Find the HyperIndex tab
    const hyperIndexTab = docsJson.navigation.tabs.find(tab => tab.tab === "HyperIndex");
    if (!hyperIndexTab) {
      console.error("HyperIndex tab not found in docs.json");
      return;
    }

    // Find or create the Supported Networks group
    let supportedNetworksGroup = hyperIndexTab.groups.find(group => group.group === "Supported Networks");
    
    if (!supportedNetworksGroup) {
      // Create new group before "Other" group
      const otherGroupIndex = hyperIndexTab.groups.findIndex(group => group.group === "Other");
      const insertIndex = otherGroupIndex >= 0 ? otherGroupIndex : hyperIndexTab.groups.length;
      
      supportedNetworksGroup = {
        group: "Supported Networks",
        expanded: false,
        pages: networkPages
      };
      hyperIndexTab.groups.splice(insertIndex, 0, supportedNetworksGroup);
    } else {
      // Update existing group
      supportedNetworksGroup.pages = networkPages;
      // Ensure expanded property is set to false for Supported Networks
      supportedNetworksGroup.expanded = false;
      // Remove old collapse property if it exists
      if (supportedNetworksGroup.collapse !== undefined) {
        delete supportedNetworksGroup.collapse;
      }
    }

    // Ensure HyperSync supported networks page exists
    const hyperSyncTab = docsJson.navigation.tabs.find(tab => tab.tab === "HyperSync");
    if (hyperSyncTab) {
      let hyperSyncSupportedNetworksGroup = hyperSyncTab.groups.find(group => group.group === "Supported Networks");
      
      if (!hyperSyncSupportedNetworksGroup) {
        // Add after Core Features group
        const coreFeaturesIndex = hyperSyncTab.groups.findIndex(group => group.group === "Core Features");
        const insertIndex = coreFeaturesIndex >= 0 ? coreFeaturesIndex + 1 : hyperSyncTab.groups.length;
        
        hyperSyncSupportedNetworksGroup = {
          group: "Supported Networks",
          expanded: false,
          pages: ["HyperSync/hypersync-supported-networks"]
        };
        hyperSyncTab.groups.splice(insertIndex, 0, hyperSyncSupportedNetworksGroup);
      } else {
        // Update if it exists
        if (!hyperSyncSupportedNetworksGroup.pages.includes("HyperSync/hypersync-supported-networks")) {
          hyperSyncSupportedNetworksGroup.pages = ["HyperSync/hypersync-supported-networks"];
        }
        // Ensure expanded property is set to false for Supported Networks
        hyperSyncSupportedNetworksGroup.expanded = false;
        // Remove old collapse property if it exists
        if (hyperSyncSupportedNetworksGroup.collapse !== undefined) {
          delete hyperSyncSupportedNetworksGroup.collapse;
        }
      }
    }

    // Validate JSON before writing
    const jsonString = JSON.stringify(docsJson, null, 2);
    try {
      JSON.parse(jsonString); // Validate it's valid JSON
    } catch (e) {
      console.error("Error: Generated JSON is invalid:", e.message);
      return;
    }
    
    // Write updated docs.json with proper formatting (ensure trailing newline)
    fs.writeFileSync(docsJsonPath, jsonString + "\n", "utf8");
    console.log("✅ docs.json updated successfully.");
  } catch (error) {
    console.error("Error updating docs.json:", error);
  }
};

// Main function
const main = async () => {
  console.log("Updating supported networks...\n");
  
  await updateHyperSyncMarkdownFile();
  await updateHyperRPCMarkdownFile();
  const networkPages = await generateMarkdownFiles();
  
  if (networkPages && networkPages.length > 0) {
    updateDocsJson(networkPages);
  }
  
  console.log("\n✅ All updates completed!");
};

main();
