import json
import sys

# Windows環境でUTF-8出力を有効化
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 元のファイルを読み込む
with open('04_powerspot_database.json', 'r', encoding='utf-8') as f:
    content = f.read()

# JSONをパース
data = json.loads(content)

# 最初の数件を確認
print(f"パワースポット数: {len(data)}")
print("\n最初の5つ:")
for i, spot in enumerate(data[:5], 1):
    # すべてのキーをチェック
    keys = list(spot.keys())
    if len(keys) >= 2:
        region = spot[keys[0]]
        spot_name = spot[keys[1]]
        print(f"{i}. {region} - {spot_name}")
    else:
        print(f"{i}. {spot}")

# キー名を確認
print("\n最初のアイテムのキー:")
for key in data[0].keys():
    print(f"  '{key}'")

# 修正したデータを保存
with open('powerspot_database.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n保存完了: powerspot_database.json")
