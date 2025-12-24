import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { parseArgs } from 'node:util'

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || '',
});

const prisma = new PrismaClient({ adapter });

const options = {
  environment: { type: 'string' },
}

async function main()
{

    const {
	values: { environment },
    } = parseArgs({ options })

    console.log('🌱 Début du seeding...');
    console.log('Valeur de l\'option environment : ', environment);
    
    switch (environment) {
	case 'sheeps-only':
	    console.log('🐑🐑🐑 Mode génération de moutons...')
	    const sheep = ({
		data: [
		    {
			lat : ( 36.7538 - 35.6971  ) * Math.random() + 35.6971,
			lng : ( 6.6147 - (-0.6308) ) * Math.random() - 0.6308,
		    }
		]
	    }); 

	    console.log(sheep);
	    
	    break
    default:
	    // Nettoyer les données existantes (optionnel)
	    await prisma.user.deleteMany();

	    // Créer des utilisateurs de test
	    const users = await prisma.user.createMany({
		data: [
		    {
			email: 'alice@example.com',
			name: 'Alice Dupont',
		    },
		    {
			email: 'bob@example.com',
			name: 'Bob Martin',
		    },
		    {
			email: 'charlie@example.com',
			name: 'Charlie Durand',
		    },
		],
	    });
	    
	    console.log(`✅ ${users.count} utilisateurs créés`);

	    // Afficher les utilisateurs créés
	    const allUsers = await prisma.user.findMany();
	    console.log('\n📋 Utilisateurs dans la base de données :');
	    allUsers.forEach((user) =>
		{
		    console.log(`   - ${user.name} (${user.email})`);
		});
	    
	    break
    }
    
    console.log('\n✨ Seeding terminé avec succès !');
}

try
{
    await main();
}
catch (e)
{
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
}
finally
{
    await prisma.$disconnect();
}
