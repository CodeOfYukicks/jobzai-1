import { Font } from '@react-pdf/renderer';

export const registerPDFFonts = () => {
    Font.register({
        family: 'Inter',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf' },
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc2dthjQ.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcB9xhjQ.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/inter/v20/UcCM3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTcPtxhjQ.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Montserrat',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Ew-.ttf' },
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCu170w-.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM70w-.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R9aX8.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq3p6aX8.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/montserrat/v31/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq0N6aX8.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });



    Font.register({
        family: 'Poppins',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiEyp8kv8JHgFVrFJA.ttf' },
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLEj6V1s.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiByp8kv8JHgFVrLCz7V1s.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiGyp8kv8JHgFVrJJLedw.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiDyp8kv8JHgFVrJJLmr19lEA.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/poppins/v22/pxiDyp8kv8JHgFVrJJLmy15lEA.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Lato',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/lato/v25/S6uyw4BMUTPHvxk.ttf' },
            { src: 'https://fonts.gstatic.com/s/lato/v25/S6u9w4BMUTPHh6UVew8.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/lato/v25/S6u8w4BMUTPHjxswWw.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/lato/v25/S6u_w4BMUTPHjxsI5wqPHA.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Roboto',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf' },
            { src: 'https://fonts.gstatic.com/s/roboto/v50/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/roboto/v50/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLoHQiA8.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/roboto/v50/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLmbXiA8.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Open Sans',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4n.ttf' },
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsgH1y4n.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4n.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVc.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0RkxhjaVc.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/opensans/v44/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0RkyFjaVc.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Playfair Display',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiukDQ.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtY.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_naUbtY.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_k-UbtY.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Lora',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuyJG.ttf' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787zAvCJG.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787z5vCJG.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-MoFkqg.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-BQCkqg.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/lora/v37/0QI8MX1D_JOuMw_hLdO6T2wV9KnW-C0Ckqg.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Merriweather',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrgCcqEw.ttf' }, // Light 300 as Regular
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4D0qyriQwlOrhSvowK_l5UcA6zuSYEqOzpPe3HOZJ5eX1WtLaQwmYiScCmDxhtNOKl8yDrOSAqEw.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmScUF3w.ttf', fontStyle: 'italic' }, // Light Italic 300 as Italic
            { src: 'https://fonts.gstatic.com/s/merriweather/v33/u-4B0qyriQwlOrhSvowK_l5-eTxCVx0ZbwLvKH2Gk9hLmp0v5yA-xXPqCzLvPee1XYk_XSf-FmQlV13w.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Raleway',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaooCP.ttf' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVsEpYCP.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVs9pYCP.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4WjMPrQ.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4bbLPrQ.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/raleway/v37/1Pt_g8zYS_SKggPNyCgSQamb1W0lwk4S4Y_LPrQ.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });

    Font.register({
        family: 'Source Sans Pro',
        fonts: [
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xK3dSBYKcSV-LCoeQqfX1RYOo3aPw.ttf' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rAkA.ttf', fontWeight: 600 },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKydSBYKcSV-LCoeQqfX1RYOo3ig4vAkA.ttf', fontWeight: 700 },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xK1dSBYKcSV-LCoeQqfX1RYOo3qPa7g.ttf', fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZY4lBdr.ttf', fontWeight: 600, fontStyle: 'italic' },
            { src: 'https://fonts.gstatic.com/s/sourcesanspro/v23/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZclRdr.ttf', fontWeight: 700, fontStyle: 'italic' },
        ],
    });
};
