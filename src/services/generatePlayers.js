const fs = require("fs/promises");
const path = require("path");

const famousPlayers = [
  "Lionel Messi",
  "Cristiano Ronaldo",
  "Erling Haaland",
  "Kylian Mbappe",
  "Lamine Yamal",
  "Jude Bellingham",
  "Vinicius Junior",
  "Mohamed Salah",
  "Harry Kane",
  "Kevin De Bruyne",
  "Neymar",
  "Luka Modric",
  "Robert Lewandowski",
  "Antoine Griezmann",
  "Bukayo Saka",
  "Phil Foden",
  "Declan Rice",
  "Rodri",
  "Bernardo Silva",
  "Virgil van Dijk",
  "Bruno Fernandes",
  "Son Heung-min",
  "Jamal Musiala",
  "Florian Wirtz",
  "Pedri",
  "Gavi",
  "Frenkie de Jong",
  "Ronald Araujo",
  "Lautaro Martinez",
  "Julian Alvarez",
  "Alexis Mac Allister",
  "Enzo Fernandez",
  "Luis Diaz",
  "Darwin Nunez",
  "Victor Osimhen",
  "Rafael Leao",
  "Federico Valverde",
  "Aurelien Tchouameni",
  "Eduardo Camavinga",
  "Alisson Becker",
  "Ederson",
  "Thibaut Courtois",
  "Manuel Neuer",
  "Marcus Rashford",
  "Martin Odegaard",
  "William Saliba",
  "Ruben Dias",
  "Leroy Sane",
  "Karim Benzema",
  "Sadio Mane",
  "David Beckham",
];

function normalizeText(text) {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function generatePlayers() {
  const targetDir = path.join(process.cwd(), "src", "assets", "data");
  const targetFile = path.join(targetDir, "players.json");

  let resultPlayers = [];

  try {
    const dataStr = await fs.readFile(targetFile, "utf-8");
    resultPlayers = JSON.parse(dataStr);
    console.log(`Đã tải ${resultPlayers.length} cầu thủ từ file.`);
  } catch (err) {
    console.log("Chưa có file players.json hoặc file trống. Bắt đầu mới.");
  }

  const seenIds = new Set();
  const dedupedPlayers = [];
  for (const p of resultPlayers) {
    if (!seenIds.has(p.idPlayer)) {
      seenIds.add(p.idPlayer);
      dedupedPlayers.push(p);
    }
  }
  resultPlayers = dedupedPlayers;
  console.log(
    `Số cầu thủ sau khi loại bỏ trùng lặp ID: ${resultPlayers.length}`,
  );

  const existingNamesNormalized = new Set(
    resultPlayers.map((p) => normalizeText(p.name)),
  );

  const playersToFetch = famousPlayers.filter(
    (name) => !existingNamesNormalized.has(normalizeText(name)),
  );

  if (playersToFetch.length === 0) {
    console.log("Tất cả cầu thủ đã được tải đầy đủ!");

    resultPlayers.sort((a, b) => a.name.localeCompare(b.name));
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      targetFile,
      JSON.stringify(resultPlayers, null, 2),
      "utf-8",
    );

    console.log(`Generated ${resultPlayers.length} players successfully.`);
    return;
  }

  console.log(`Cần tải thêm ${playersToFetch.length} cầu thủ...`);

  for (let i = 0; i < playersToFetch.length; i++) {
    const name = playersToFetch[i];
    console.log(`Fetching ${name}... (${i + 1}/${playersToFetch.length})`);
    try {
      const url = `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(name)}`;
      const response = await fetch(url);

      if (response.status === 429) {
        console.error(
          `Bị giới hạn tần suất (HTTP 429) khi tải ${name}. Dừng tải thêm để tránh bị block.`,
        );
        break;
      }

      if (!response.ok) {
        console.error(`Lỗi HTTP ${response.status} khi tải cầu thủ ${name}`);
        continue;
      }

      const data = await response.json();

      if (data && data.player && data.player.length > 0) {
        const p = data.player[0];

        const mappedPlayer = {
          idPlayer: p.idPlayer || "",
          idTeam: p.idTeam || "",
          name: p.strPlayer || "",
          team: p.strTeam || "",
          sport: p.strSport || "",
          thumb: p.strThumb || "",
          cutout: p.strCutout || "",
          nationality: p.strNationality || "",
          dateBorn: p.dateBorn || "",
          status: p.strStatus || "",
          gender: p.strGender || "",
          position: p.strPosition || "",
        };

        if (!seenIds.has(mappedPlayer.idPlayer)) {
          seenIds.add(mappedPlayer.idPlayer);
          resultPlayers.push(mappedPlayer);
        }

        resultPlayers.sort((a, b) => a.name.localeCompare(b.name));
        await fs.mkdir(targetDir, { recursive: true });
        await fs.writeFile(
          targetFile,
          JSON.stringify(resultPlayers, null, 2),
          "utf-8",
        );
      } else {
        console.warn(`Không tìm thấy dữ liệu cho cầu thủ: ${name}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));
    } catch (error) {
      console.error(`Lỗi xảy ra khi fetch cầu thủ ${name}:`, error.message);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  resultPlayers.sort((a, b) => a.name.localeCompare(b.name));
  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(
    targetFile,
    JSON.stringify(resultPlayers, null, 2),
    "utf-8",
  );

  console.log(`Generated ${resultPlayers.length} players successfully.`);
}

generatePlayers();
