import puppeteer from 'puppeteer';
import type1 from "./type1.js";
import type2 from "./type2.js";
import type3 from "./type3.js";

export default async function generator(json, yMirror, returnData, additionalData) {

	let result;

	function invalidDataMessage(message) {
		return {error: message};
	}

	function getJSONType() {
		if ('layers' in json) return 'camera';
		else if ('type' in json && (json.type === 1)) return 'panels';
		else return invalidDataMessage("конфигурация стен не соответствует ни одному из известных типов");
	}

	switch(getJSONType()) {

		case 'camera':
	
			function getCameraType() {
				let innerWalls = 0;
				let outerWalls = 0;
				for (let key in wallsJSON) {
					if (wallsJSON[key].properties.partition) innerWalls++;
					else outerWalls++;
				}
				if (outerWalls === 4) return 3;
				else if (outerWalls === 3) return 2;
			}

			/* Проверка входящих данных>> */
			if (!('layer-1' in json.layers)) return invalidDataMessage("в объекте 'layers' отсутствует свойство 'layer-1'");
			else if (!('lines' in json.layers['layer-1'])) return invalidDataMessage("в объекте 'layer-1' отсутствует свойство 'lines'");
			else if (!('vertices' in json.layers['layer-1'])) return invalidDataMessage("в объекте 'layer-1' отсутствует свойство 'vertices'");
			else if (!('holes' in json.layers['layer-1'])) return invalidDataMessage("в объекте 'layer-1' отсутствует свойство 'holes'");
			/* <<Проверка входящих данных */

			const wallsJSON = json.layers['layer-1'].lines;
			const featuresJSON = json.layers['layer-1'].vertices;
			const holesJSON = json.layers['layer-1'].holes;

			/* Проверка входящих данных>> */
			for (let key in wallsJSON) {
				if (!('vertices' in wallsJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'vertices'`);
				else if (wallsJSON[key].vertices.length !== 2) return invalidDataMessage(`количество элементов vertices в объекте '${key}' не равно двум`);
				else if (!('properties' in wallsJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'properties'`);
				else if (!('width' in wallsJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'width'`);
				else if (!('height' in wallsJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'height'`);
				else if (!('thickness' in wallsJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'thickness'`);
				else if (!('textureA' in wallsJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'textureA'`);
				else if (!('textureB' in wallsJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'textureB'`);
				else if (!('id' in wallsJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'id'`);
				else if (!('holes' in wallsJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'holes'`);
			}
			for (let key in featuresJSON) {
				if (!('x' in featuresJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'x'`);
				else if (!('y' in featuresJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'y'`);
			}
			for (let key in holesJSON) {
				if (!('line' in holesJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'line'`);
				else if (!('type' in holesJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'type'`);
				else if (!('misc' in holesJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'misc'`);
				else if (!('offsetA' in holesJSON[key].misc)) return invalidDataMessage(`в объекте '${key}.misc' отсутствует свойство 'offsetA'`);
				else if (!('properties' in holesJSON[key])) return invalidDataMessage(`в объекте '${key}' отсутствует свойство 'properties'`);
				else if (!('width' in holesJSON[key].properties)) return invalidDataMessage(`в объекте '${key}.properties' отсутствует свойство 'width'`);
				else if (typeof holesJSON[key].properties.width !== 'number' && (!('length' in holesJSON[key].properties.width))) return invalidDataMessage(`в объекте '${key}.properties.width' отсутствует свойство 'width'`);
			}
			/* <<Проверка входящих данных */

			const type = getCameraType();

			if (type === 2) result = type2(json, yMirror, returnData, additionalData);
			else if (type === 3) result = type3(json, yMirror, returnData, additionalData);
			else return {error: type};

			if (result.error) return result;

		break;

		case 'panels':

			/* Проверка входящих данных>> */
			if (!('panels' in json)) return invalidDataMessage("не найдено свойство 'panels'");
			for (const [index, panel] of json.panels.entries()) {
				if (!('number' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'number'`);
				else if (!('name' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'name'`);
				else if (!('type' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'type'`);
				else if (!('material' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'material'`);
				else if (!('length' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'length'`);
				else if (!('width' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'width'`);
				else if (!('thickness' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'thickness'`);
				else if (!('square' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'square'`);
				else if (!('amount' in panel)) return invalidDataMessage(`в объекте №${index + 1} массива 'panels' отсутствует свойство 'amount'`);
			}
			/* <<Проверка входящих данных */

            let doors = false;
            if ('doors' in json) {
                doors = true;
            }

            result = type1(json, doors, returnData, additionalData);

		break;

		default: return invalidDataMessage("конфигурация стен не соответствует ни одному из известных типов");
	}

	if (returnData === "pdf") {
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				'--disable-features=IsolateOrigins',
				'--disable-site-isolation-trials',
				'--autoplay-policy=user-gesture-required',
				'--disable-background-networking',
				'--disable-background-timer-throttling',
				'--disable-backgrounding-occluded-windows',
				'--disable-breakpad',
				'--disable-client-side-phishing-detection',
				'--disable-component-update',
				'--disable-default-apps',
				'--disable-dev-shm-usage',
				'--disable-domain-reliability',
				'--disable-extensions',
				'--disable-features=AudioServiceOutOfProcess',
				'--disable-hang-monitor',
				'--disable-ipc-flooding-protection',
				'--disable-notifications',
				'--disable-offer-store-unmasked-wallet-cards',
				'--disable-popup-blocking',
				'--disable-print-preview',
				'--disable-prompt-on-repost',
				'--disable-renderer-backgrounding',
				'--disable-setuid-sandbox',
				'--disable-speech-api',
				'--disable-sync',
				'--disable-web-security',
				'--font-render-hinting=none',
				'--force-color-profile=srgb',
				'--hide-scrollbars',
				'--ignore-gpu-blacklist',
				'--metrics-recording-only',
				'--mute-audio',
				'--no-default-browser-check',
				'--no-first-run',
				'--no-pings',
				'--no-sandbox',
				'--no-zygote',
				'--password-store=basic',
				'--use-gl=swiftshader',
				'--use-mock-keychain'
			]
		});
		const page = await browser.newPage();

		await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36");
		await page.setContent(result.data, {waitUntil: 'domcontentloaded'});
		await page.evaluateHandle('document.fonts.ready');
		await page.addStyleTag({path: 'style.css'});
	
		const pdf = await page.pdf({format: 'A4'});
	
		await browser.close();
	
		return {data: 'data:application/pdf;base64,' + pdf.toString('base64')};
	}
	else if (returnData === 'img') {
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				'--disable-features=IsolateOrigins',
				'--disable-site-isolation-trials',
				'--autoplay-policy=user-gesture-required',
				'--disable-background-networking',
				'--disable-background-timer-throttling',
				'--disable-backgrounding-occluded-windows',
				'--disable-breakpad',
				'--disable-client-side-phishing-detection',
				'--disable-component-update',
				'--disable-default-apps',
				'--disable-dev-shm-usage',
				'--disable-domain-reliability',
				'--disable-extensions',
				'--disable-features=AudioServiceOutOfProcess',
				'--disable-hang-monitor',
				'--disable-ipc-flooding-protection',
				'--disable-notifications',
				'--disable-offer-store-unmasked-wallet-cards',
				'--disable-popup-blocking',
				'--disable-print-preview',
				'--disable-prompt-on-repost',
				'--disable-renderer-backgrounding',
				'--disable-setuid-sandbox',
				'--disable-speech-api',
				'--disable-sync',
				'--disable-web-security',
				'--font-render-hinting=none',
				'--force-color-profile=srgb',
				'--hide-scrollbars',
				'--ignore-gpu-blacklist',
				'--metrics-recording-only',
				'--mute-audio',
				'--no-default-browser-check',
				'--no-first-run',
				'--no-pings',
				'--no-sandbox',
				'--no-zygote',
				'--password-store=basic',
				'--use-gl=swiftshader',
				'--use-mock-keychain'
			]
		});
		const page = await browser.newPage();

		await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36");
		await page.setContent(result.scheme, {waitUntil: 'domcontentloaded'});
		await page.evaluateHandle('document.fonts.ready');
		await page.addStyleTag({path: 'style.css'});
	
		const imageBuffer = await page.screenshot({ omitBackground: true });
	
		await browser.close();
	
		return {image: `<img src="data:image/png;base64,${imageBuffer.toString('base64')}" alt="">`, table: result.table};
	}
	else if (returnData === 'svg') return result;

}