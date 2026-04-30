import React from 'react';
import {
  Check, CarIcon, ClipboardIcon, ShieldIcon, FileText, MessageIcon,
} from '../../components/icons.jsx';
import { useLang } from '../../i18n/LangContext.jsx';

export default function Features() {
  const { t } = useLang();
  const featureKeys = [
    { icon: CarIcon,       key: 'schaden'  },
    { icon: ClipboardIcon, key: 'kfz'      },
    { icon: ShieldIcon,    key: 'wert'     },
    { icon: FileText,      key: 'kosten'   },
    { icon: MessageIcon,   key: 'beratung' },
    { icon: CarIcon,       key: 'leasing'  },
  ];
  const features = featureKeys.map(({ icon, key }) => ({
    icon,
    title: t(`features.${key}.title`),
    desc:  t(`features.${key}.desc`),
    list:  t(`features.${key}.list`),
  }));

  return (
    <section id="leistungen" className="py-24 bg-[#F9FAFB]">
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black tracking-tight text-[#0A0A0A] mb-4 uppercase">
            {t('features.heading_pre')} <span className="text-[#E30613]">{t('features.heading_main')}</span>
          </h2>
          <div className="w-20 h-1 bg-[#E30613] mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-gray-100">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-10 bg-white border border-gray-50 flex flex-col items-start text-left group hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-8 text-[#E30613] group-hover:bg-[#E30613] group-hover:text-white transition-colors duration-300">
                <f.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-[#0A0A0A] mb-6 tracking-tight uppercase leading-tight">
                {f.title}
              </h3>
              <p className="text-[#4B5563] text-sm leading-relaxed mb-8">
                {f.desc}
              </p>
              <ul className="space-y-3 mt-auto">
                {f.list.map((item, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-[#4B5563]">
                    <Check size={14} className="text-[#E30613] mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
