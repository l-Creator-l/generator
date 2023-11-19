export default function type1(json, doors, returnData, additionalData) {

	const panels = json.panels;

	panels.forEach(panel => {

        const standartSize = [300, 600, 900, 1200];

        if (panel.material === 'ss') panel.material = 'сталь - сталь';
        else if (panel.material === 'ns') panel.material = 'сталь - нержавейка';
        else if (panel.material === 'nn') panel.material = 'нержавейка - нержавейка';

        switch (panel.type) {

            case 'wall':

                panel.indicator = standartSize.includes(Number(panel.length)) ? 'Стандартная' : 'Нестандартная';

            break;

            case 'ceil':

                panel.indicator = (panel.length <= 2560 && standartSize.includes(Number(panel.width))) ? 'Стандартная' : 'Нестандартная';

            break;

            case 'floor':

                panel.indicator = (panel.length <= 2560 && standartSize.includes(Number(panel.width))) ? 'Стандартная' : 'Нестандартная';

            break;

        }
        
	});

	const tableLeft = `
		<table class="document__tableLeft" rules="all">
			<tr>
				<td class="document__tableLeftCell" height="80px"></td>
				<td class="document__tableLeftCell" height="80px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="80px"></td>
				<td class="document__tableLeftCell" height="80px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="130px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl">Артикул</td>
				<td class="document__tableLeftCell" height="130px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="180px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl">Подпись и дата</td>
				<td class="document__tableLeftCell" height="180px"></td>
			</tr>
			<tr>
				<td class="document__tableLeftCell" height="130px" align="center" nowrap style="transform: scale(-1); writing-mode: vertical-rl"><p>Заказчик</td>
				<td class="document__tableLeftCell" height="130px"></td>
			</tr>
		</table>
	`;

	const svg = `
		<svg class="document__svg" width="730" height="450" viewBox="50 50 350 350" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			
            <defs>

                <linearGradient id="gradient">
                    <stop offset="0%" stop-color="#ADADAD"/>
                    <stop offset="20%" stop-color="#C0C1C3"/>
                    <stop offset="40%" stop-color="#B3B3B3"/>
                    <stop offset="60%" stop-color="#C0C1C3"/>
                    <stop offset="80%" stop-color="#B1B2B3"/>
                </linearGradient>

            </defs>

            <g class="bottomPanel" fill="none">
                <path d="m22 290 l34 -78 l304 5 l-3 75 z" fill="url(#gradient)" stroke="#666768" stroke-width="2"/>
                <path d="m20.5 290.5 l337.5 2 v15 l-337.5 -3 z" fill="#878A8C"/>
            </g>

            <g class="thirdPanel" fill="none">
                <path d="m44 265 l34 -78 l304 5 l-3 75 z" fill="url(#gradient)" stroke="#666768" stroke-width="2"/>
                <path d="m42.5 265.5 l337.5 2 v15 l-337.5 -3 z" fill="#878A8C"/>
            </g>

            <g class="secondPanel" fill="none">
                <path d="m66 240 l34 -78 l304 5 l-3 75 z" fill="url(#gradient)" stroke="#666768" stroke-width="2"/>
                <path d="m64.5 240.5 l337.5 2 v15 l-337.5 -3 z" fill="#878A8C"/>
            </g>

            <g class="topPanel" fill="none">
                <path d="m88 215 l34 -78 l304 5 l-3 75 z" fill="url(#gradient)" stroke="#666768" stroke-width="2"/>
                <path d="m86.5 215.5 l337.5 2 v15 l-337.5 -3 z" fill="#878A8C"/>
            </g>

            ${doors ? `` : ''}

		</svg>
	`;

	const svgURI = "data:image/svg+xml," + encodeURI(svg).replace(/#/g, '%23');

	const summary = `<p class="document__summary">Произвольный набор панелей</p>`;

	const tableCommon = `
		<div class="document__common">

            ${ 
                panels.some(panel => panel.type === 'wall') ?
                    `<div class="document__commonRow">
                        <p class="document__commonText">Площадь стеновых панелей (м2)</p>
                        <div class="document__commonUnderline"></div>
                        <p class="document__commonText" align="right">
                            ${
                                panels.reduce((sum, panel) => {
                                    if (panel.type === 'wall') return sum + Number((((panel.length / 1000) * (panel.width / 1000)) * panel.amount).toFixed(2));
                                    else return sum;
                                }, 0)
                            }
                        </p>
                    </div>`
                : ''
            }

            ${ 
                panels.some(panel => panel.type === 'ceil') ?
                    `<div class="document__commonRow">
                        <p class="document__commonText">Площадь потолочных панелей (м2)</p>
                        <div class="document__commonUnderline"></div>
                        <p class="document__commonText" align="right">
                            ${
                                panels.reduce((sum, panel) => {
                                    if (panel.type === 'ceil') return sum + Number((((panel.length / 1000) * (panel.width / 1000)) * panel.amount).toFixed(2));
                                    else return sum;
                                }, 0)
                            }
                        </p>
                    </div>`
                : ''
            }

            ${ 
                panels.some(panel => panel.type === 'floor') ?
                    `<div class="document__commonRow">
                        <p class="document__commonText">Площадь половых панелей (м2)</p>
                        <div class="document__commonUnderline"></div>
                        <p class="document__commonText" align="right">
                            ${
                                panels.reduce((sum, panel) => {
                                    if (panel.type === 'floor') return sum + Number((((panel.length / 1000) * (panel.width / 1000)) * panel.amount).toFixed(2));
                                    else return sum;
                                }, 0)
                            }
                        </p>
                    </div>`
                : ''
            }

		</div>
	`;

	const tableDetail = `
		<table class="document__tableDetail">

			<tr>
				<td class="document__tableDetailCell" align="center">№</td>
				<td class="document__tableDetailCell">Наименование товара</td>
				<td class="document__tableDetailCell">Индикатор</td>
				<td class="document__tableDetailCell" align="center">Обшивка</td>
				<td class="document__tableDetailCell" align="center">Толщина</td>
				<td class="document__tableDetailCell" align="center">Размер</td>
				<td class="document__tableDetailCell" align="center">Количество</td>
				<td class="document__tableDetailCell" align="center">S, м2</td>
			</tr>

			${(panels.map(panel => `
				<tr>
					<td class="document__tableDetailCell" align="center">${panel.number}</td>
					<td class="document__tableDetailCell">${panel.name}</td>
					<td class="document__tableDetailCell">${panel.indicator}</td>
					<td class="document__tableDetailCell" align="center">${panel.material}</td>
					<td class="document__tableDetailCell" align="center">${panel.thickness}</td>
					<td class="document__tableDetailCell" align="center">${panel.length} X ${panel.width}</td>
					<td class="document__tableDetailCell" align="center">${panel.amount}</td>
					<td class="document__tableDetailCell" align="center">${panel.square}</td>
				</tr>
			`)).join('')}

		</table>
	`;

	const tableBottom = `
		<table class="document__tableBottom" rules="all">
			<tr>
				<td class="document__tableBottomCell">${additionalData ? additionalData.id : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.date : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.price : ''}</td>
				<td class="document__tableBottomCell">${additionalData ? additionalData.nds : ''}</td>
				<td class="document__tableBottomCell">${summary}</td>
				<td class="document__tableBottomCell">Лист</td>
			</tr>
			<tr>
				<td class="document__tableBottomCell">Заказ</td>
				<td class="document__tableBottomCell">Дата</td>
				<td class="document__tableBottomCell">Стоимость</td>
				<td class="document__tableBottomCell"></td>
				<td class="document__tableBottomCell"></td>
				<td class="document__tableBottomCell">1</td>
			</tr>
		</table>
	`;

	if (returnData === 'pdf') {
		return {
			data: `
				<div class="document">
					<svg class="document__title" width="86.6986mm" height="8.4666mm" fill-rule="evenodd" viewBox="0 0 8669.86 846.66">
						<polygon points="2118.66,22.1 2461.28,22.1 2461.28,736.2 2692.41,736.2 2692.41,827.06 2118.66,827.06" fill="#003154"/>
						<rect x="3828.04" y="22.1" width="343.29" height="804.96" fill="#003154"/>
						<path d="M1440.47 0c130.84,0 258.92,38.53 346.68,110.97 93.39,77.09 142.33,191.82 142.33,312.36 0,131.62 -58.24,256 -172.28,336.13 -79.2,55.64 -198.7,87.2 -316.73,87.2 -119.42,0 -232.82,-29.78 -317.74,-91.34 -107.11,-77.65 -169.94,-183.71 -171.26,-331.99 -1.1,-122.35 47.74,-239.54 145.26,-318.8 87.03,-70.75 215.01,-104.53 343.74,-104.53zm-34.04 65.51c-68.15,34.52 -88.32,123.37 -97.57,193.65 -18.8,142.78 9.71,424.67 137.37,505.9 10.48,6.67 21.4,12.65 32.24,18.69 55.91,-34.36 71.54,-65.01 88.5,-131.66 39.64,-155.77 9.7,-459.89 -122.65,-566.06 -14.1,-10.81 -25.99,-15.67 -37.89,-20.52z" fill="#003154"/>
						<path d="M-0 22.1l342.35 0c48.01,0 96.01,0 131.69,0 35.68,0 59.03,0 85.9,1.84 26.87,1.85 57.27,5.53 86.02,12.11 28.74,6.59 55.83,16.08 77.42,26.89 21.59,10.81 37.67,22.95 50.56,34.65 12.88,11.69 22.57,22.95 31.6,38.5 9.04,15.56 17.41,35.42 22.47,54.83 5.07,19.42 6.83,38.4 7.71,59.25 0.88,20.85 0.88,43.58 -1.21,67.3 -2.09,23.72 -6.28,48.43 -13.66,74.36 -7.38,25.93 -17.95,53.07 -31.61,76.79 -13.65,23.72 -30.39,44.02 -50.11,61.45 -19.71,17.44 -42.4,32 -68.39,43.92 -26,11.91 -55.29,21.18 -85.83,27.46 -30.53,6.29 -62.31,9.6 -96.12,10.48 -33.81,0.88 -69.66,-0.66 -94.41,-2.86 -24.74,-2.21 -38.39,-5.08 -52.03,-7.94l0 225.93 -342.35 0 0 -804.96zm342.35 64.35c10.68,-0.44 21.35,-0.88 32.64,0.11 11.29,1 23.18,3.42 35.85,8.28 12.66,4.85 26.1,12.14 38.66,23.06 12.55,10.92 24.23,25.48 32.71,40.93 8.48,15.45 13.76,31.77 18.06,49.87 4.29,18.09 7.6,37.95 8.37,61.31 0.78,23.36 -0.98,50.21 -3.25,72.78 -2.28,22.56 -5.08,40.83 -9.27,59.06 -4.19,18.24 -9.76,36.44 -16.52,54.15 -6.75,17.71 -14.68,34.92 -21.73,48.27 -7.05,13.35 -13.22,22.84 -19.39,32.33 -32.04,-2.65 -64.09,-5.3 -96.13,-7.95 0,-147.4 0,-294.8 0,-442.2z" fill="#003154"/>
						<path d="M4486.97 22.1l342.35 0 55.53 0 76.16 0c10.82,0 20.5,0 29.5,0.05l6.58 -0.01c142.66,-0.55 291.63,3.8 330.13,174.09 30.63,135.48 -20.39,281.49 -151.03,330.68l196.17 300.15 -369.4 0 -125.91 -277.33c-22.06,-1.93 -34.9,-4.36 -47.73,-6.78l0 58.18 0 88.13 0 137.8 -342.35 0 0 -804.96zm342.35 64.5l0 391.15c32.05,2.38 64.09,4.76 96.14,7.15 6.16,-8.54 12.33,-17.07 19.38,-29.08 7.05,-12.01 14.98,-27.49 21.73,-43.42 6.76,-15.93 12.34,-32.3 16.53,-48.71 4.19,-16.4 6.98,-32.83 9.26,-53.13 2.28,-20.29 4.03,-44.45 3.26,-65.46 -0.78,-21.01 -4.08,-38.88 -8.38,-55.15 -4.29,-16.28 -9.58,-24.35 -18.06,-38.24 -8.48,-13.89 -20.16,-26.99 -32.71,-36.82 -12.56,-9.82 -25.99,-16.38 -38.66,-20.74 -12.66,-4.37 -24.56,-6.55 -35.85,-7.44 -11.28,-0.89 -21.96,-0.5 -32.64,-0.11z" fill="#003154"/>
						<path d="M2969.73 22.1l456.86 0 179.08 804.96 -364.17 0 -47.27 -208.52 -261.49 0 -47.59 208.52 -99.13 0 183.71 -804.96zm205.44 512.37l-93.04 -410.42 -36.54 0 -93.67 410.42 223.25 0z" fill="#003154"/>
						<path d="M5601.12 22.1l342.35 0c48.01,0 96.01,0 131.69,0 35.68,0 59.03,0 85.9,1.84 26.88,1.85 57.27,5.53 86.02,12.11 28.75,6.59 55.84,16.08 77.42,26.89 21.59,10.81 37.67,22.95 50.56,34.65 12.88,11.69 22.57,22.95 31.6,38.5 9.04,15.56 17.41,35.42 22.47,54.83 5.07,19.42 6.83,38.4 7.71,59.25 0.88,20.85 0.88,43.58 -1.21,67.3 -2.09,23.72 -6.28,48.43 -13.66,74.36 -7.38,25.93 -17.95,53.07 -31.6,76.79 -13.66,23.72 -30.4,44.02 -50.12,61.45 -19.71,17.44 -42.4,32 -68.39,43.92 -25.99,11.91 -55.29,21.18 -85.83,27.46 -30.53,6.29 -62.31,9.6 -96.12,10.48 -33.81,0.88 -69.66,-0.66 -94.41,-2.86 -24.74,-2.21 -38.39,-5.08 -52.03,-7.94l0 225.93 -342.35 0 0 -804.96zm342.35 64.35c10.68,-0.44 21.35,-0.88 32.64,0.11 11.29,1 23.18,3.42 35.85,8.28 12.67,4.85 26.1,12.14 38.66,23.06 12.55,10.92 24.23,25.48 32.71,40.93 8.48,15.45 13.77,31.77 18.06,49.87 4.3,18.09 7.6,37.95 8.37,61.31 0.78,23.36 -0.98,50.21 -3.25,72.78 -2.28,22.56 -5.07,40.83 -9.26,59.06 -4.19,18.24 -9.77,36.44 -16.53,54.15 -6.75,17.71 -14.68,34.92 -21.73,48.27 -7.05,13.35 -13.22,22.84 -19.38,32.33 -32.05,-2.65 -64.1,-5.3 -96.14,-7.95 0,-147.4 0,-294.8 0,-442.2z" fill="#F44336"/>
						<path d="M6654.47 22.1l342.35 0 55.52 0 76.17 0c10.82,0 20.5,0 29.49,0.05l6.58 -0.01c142.66,-0.55 291.64,3.8 330.13,174.09 30.63,135.48 -20.38,281.49 -151.03,330.68l196.17 300.15 -369.4 0 -125.91 -277.33c-22.06,-1.93 -34.89,-4.36 -47.72,-6.78l0 58.18 0 88.13 0 137.8 -342.35 0 0 -804.96zm342.35 64.5l0 391.15c32.04,2.38 64.09,4.76 96.13,7.15 6.17,-8.54 12.33,-17.07 19.38,-29.08 7.05,-12.01 14.98,-27.49 21.74,-43.42 6.75,-15.93 12.33,-32.3 16.52,-48.71 4.19,-16.4 6.99,-32.83 9.26,-53.13 2.28,-20.29 4.04,-44.45 3.26,-65.46 -0.77,-21.01 -4.08,-38.88 -8.37,-55.15 -4.3,-16.28 -9.59,-24.35 -18.07,-38.24 -8.48,-13.89 -20.15,-26.99 -32.71,-36.82 -12.55,-9.82 -25.99,-16.38 -38.65,-20.74 -12.67,-4.37 -24.57,-6.55 -35.85,-7.44 -11.29,-0.89 -21.97,-0.5 -32.64,-0.11z" fill="#F44336"/>
						<path d="M8180.85 0c130.83,0 258.92,38.53 346.67,110.97 93.39,77.09 142.34,191.82 142.34,312.36 0,131.62 -58.24,256 -172.29,336.13 -79.19,55.64 -198.69,87.2 -316.72,87.2 -119.43,0 -232.82,-29.78 -317.74,-91.34 -107.11,-77.65 -169.95,-183.71 -171.27,-331.99 -1.09,-122.35 47.75,-239.54 145.27,-318.8 87.03,-70.75 215.01,-104.53 343.74,-104.53zm-34.04 65.51c-68.15,34.52 -88.32,123.37 -97.57,193.65 -18.8,142.78 9.7,424.67 137.37,505.9 10.47,6.67 21.39,12.65 32.23,18.69 55.91,-34.36 71.55,-65.01 88.5,-131.66 39.64,-155.77 9.71,-459.89 -122.64,-566.06 -14.1,-10.81 -25.99,-15.67 -37.89,-20.52z" fill="#F44336"/>
					</svg>
					<div class="document__body">
						${tableLeft}
						<div class="document__main">
							<div class="document__content">
								<img class="document__svgContainer" alt="" src="${svgURI}">
								<div class="document__tables document__tables-type1">
									<div class="document__tableContainer">
										<p class="document__tableCommonHeader">Параметры набора панелей</p>
										${tableCommon}
									</div>
									<div class="document__tableContainer document__tableContainer-type1">
										<p class="document__tableDetailHeader">Произвольный набор панелей</p>
										${tableDetail}
									</div>
								</div>
							</div>
							${tableBottom}
						</div>
					</div>
				</div>
			`
		}
	}
	else return {
		scheme: svg,
		table: `
			<div class="container">
				${summary}
				${tableDetail}
			</div>
		`
	}

}